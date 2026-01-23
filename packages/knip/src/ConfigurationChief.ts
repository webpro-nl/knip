// biome-ignore lint: style/noRestrictedImports
import path from 'node:path';
import picomatch from 'picomatch';
import type { SyncCompilers } from './compilers/types.js';
import { DEFAULT_EXTENSIONS, ROOT_WORKSPACE_NAME } from './constants.js';
import type {
  Configuration,
  IgnorePatterns,
  PluginsConfiguration,
  RawConfiguration,
  RawPluginConfiguration,
  WorkspaceConfiguration,
} from './types/config.js';
import type { ConfigurationHint } from './types/issues.js';
import { type PluginName, pluginNames } from './types/PluginNames.js';
import type { WorkspacePackage } from './types/package-json.js';
import { arrayify, compact, partition } from './util/array.js';
import type { MainOptions } from './util/create-options.js';
import { createWorkspaceGraph, type WorkspaceGraph } from './util/create-workspace-graph.js';
import { isDirectory, isFile } from './util/fs.js';
import { _dirGlob, removeProductionSuffix } from './util/glob.js';
import { graphSequencer } from './util/graph-sequencer.js';
import mapWorkspaces from './util/map-workspaces.js';
import { join, relative } from './util/path.js';
import { normalizePluginConfig } from './util/plugin.js';
import { toRegexOrString } from './util/regex.js';
import { ELLIPSIS } from './util/string.js';
import { byPathDepth } from './util/workspace.js';
import { createWorkspaceFilePathFilter, type WorkspaceFilePathFilter } from './util/workspace-file-filter.js';
import { selectWorkspaces } from './util/workspace-selectors.js';

const defaultBaseFilenamePattern = '{index,cli,main}';

export const isDefaultPattern = (type: 'entry' | 'project', id: string) => {
  if (type === 'project') return id.startsWith('**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts');
  return (
    id.startsWith('{index,cli,main}.{js,mjs,cjs,jsx,ts,tsx,mts,cts') ||
    id.startsWith('src/{index,cli,main}.{js,mjs,cjs,jsx,ts,tsx,mts,cts')
  );
};

const getDefaultWorkspaceConfig = (extensions: string[] = []) => {
  const exts = [...DEFAULT_EXTENSIONS, ...extensions].map(ext => ext.slice(1)).join(',');
  return {
    entry: [`${defaultBaseFilenamePattern}.{${exts}}!`, `src/${defaultBaseFilenamePattern}.{${exts}}!`],
    project: [`**/*.{${exts}}!`],
  };
};

const isPluginName = (name: string): name is PluginName => pluginNames.includes(name as PluginName);

const defaultConfig: Configuration = {
  ignore: [],
  ignoreBinaries: [],
  ignoreDependencies: [],
  ignoreFiles: [],
  ignoreIssues: {},
  ignoreMembers: [],
  ignoreUnresolved: [],
  ignoreWorkspaces: [],
  ignoreExportsUsedInFile: false,
  isIncludeEntryExports: false,
  syncCompilers: new Map(),
  asyncCompilers: new Map(),
  rootPluginConfigs: {},
};

export type Workspace = {
  name: string;
  pkgName: string;
  dir: string;
  ancestors: string[];
  config: WorkspaceConfiguration;
  manifestPath: string;
  manifestStr: string;
  ignoreMembers: IgnorePatterns;
  srcDir?: string;
  outDir?: string;
};

/**
 * - Normalizes raw workspaces config
 * - Determines workspaces to analyze
 * - Hands out workspace and plugin configs
 */
export class ConfigurationChief {
  cwd: string;
  rawConfig?: RawConfiguration;
  isProduction: boolean;
  isStrict: boolean;
  isNoDependents: boolean;
  isIncludeEntryExports: boolean;
  config: Configuration;
  workspace: string | string[] | undefined;
  selectedWorkspaces: Set<string> | undefined;
  workspaceFilePathFilter: WorkspaceFilePathFilter = () => true;

  workspaces: string[];
  ignoredWorkspacePatterns: string[] = [];
  workspacePackages = new Map<string, WorkspacePackage>();
  workspacesByPkgName = new Map<string, Workspace>();
  workspacesByDir = new Map<string, Workspace>();
  additionalWorkspaceNames = new Set<string>();
  availableWorkspaceNames: string[] = [];
  availableWorkspacePkgNames = new Set<string>();
  availableWorkspaceDirs: string[] = [];
  workspaceGraph: WorkspaceGraph = new Map();

  constructor(options: MainOptions) {
    this.cwd = options.cwd;
    this.isProduction = options.isProduction;
    this.isStrict = options.isStrict;
    this.isNoDependents = options.isNoDependents;
    this.isIncludeEntryExports = options.isIncludeEntryExports;
    this.workspace = options.workspace;
    this.workspaces = options.workspaces;
    this.rawConfig = options.parsedConfig;
    this.config = this.normalize(options.parsedConfig ?? {});
  }

  public getConfigurationHints() {
    const hints: ConfigurationHint[] = [];
    if (this.rawConfig) {
      if (this.workspacePackages.size > 1) {
        const entry = arrayify(this.rawConfig.entry);
        if (entry.length > 0) {
          const identifier = `[${entry[0]}${entry.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
          hints.push({ type: 'entry-top-level', identifier });
        }
        const project = arrayify(this.rawConfig.project);
        if (project.length > 0) {
          const identifier = `[${project[0]}${project.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
          hints.push({ type: 'project-top-level', identifier });
        }
      }
    }
    return hints;
  }

  private normalize(rawConfig: RawConfiguration): Configuration {
    const ignore = arrayify(rawConfig.ignore ?? defaultConfig.ignore);
    const ignoreFiles = arrayify(rawConfig.ignoreFiles ?? defaultConfig.ignoreFiles);
    const ignoreBinaries = rawConfig.ignoreBinaries ?? [];
    const ignoreDependencies = rawConfig.ignoreDependencies ?? [];
    const ignoreMembers = rawConfig.ignoreMembers ?? [];
    const ignoreUnresolved = rawConfig.ignoreUnresolved ?? [];
    const ignoreExportsUsedInFile = rawConfig.ignoreExportsUsedInFile ?? false;
    const ignoreIssues = rawConfig.ignoreIssues ?? {};
    const ignoreWorkspaces = rawConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;
    const isIncludeEntryExports = rawConfig.includeEntryExports ?? this.isIncludeEntryExports;

    const { syncCompilers, asyncCompilers } = rawConfig;

    const rootPluginConfigs: Partial<PluginsConfiguration> = {};

    for (const [pluginName, pluginConfig] of Object.entries(rawConfig)) {
      if (isPluginName(pluginName)) {
        rootPluginConfigs[pluginName] = normalizePluginConfig(pluginConfig as RawPluginConfiguration);
      }
    }

    return {
      ignore,
      ignoreFiles,
      ignoreBinaries,
      ignoreDependencies,
      ignoreMembers,
      ignoreUnresolved,
      ignoreExportsUsedInFile,
      ignoreIssues,
      ignoreWorkspaces,
      isIncludeEntryExports,
      syncCompilers: new Map(Object.entries(syncCompilers ?? {})) as SyncCompilers,
      asyncCompilers: new Map(Object.entries(asyncCompilers ?? {})),
      rootPluginConfigs,
    };
  }

  public async getWorkspaces() {
    this.ignoredWorkspacePatterns = this.getIgnoredWorkspacePatterns();

    this.additionalWorkspaceNames = await this.getAdditionalWorkspaceNames();
    const workspaceNames = compact([...this.getListedWorkspaces(), ...this.additionalWorkspaceNames]);

    const [packages, wsPkgNames] = await mapWorkspaces(this.cwd, [...workspaceNames, '.']);

    this.workspacePackages = packages;

    this.availableWorkspaceNames = this.getAvailableWorkspaceNames(packages.keys());
    this.availableWorkspacePkgNames = wsPkgNames;
    this.availableWorkspaceDirs = this.availableWorkspaceNames
      .sort(byPathDepth)
      .reverse()
      .map(dir => join(this.cwd, dir));

    this.workspaceGraph = createWorkspaceGraph(this.cwd, this.availableWorkspaceNames, wsPkgNames, packages);

    this.selectedWorkspaces = this.getSelectedWorkspaces();

    this.workspaceFilePathFilter = createWorkspaceFilePathFilter(
      this.cwd,
      this.selectedWorkspaces,
      this.availableWorkspaceNames
    );

    const includedWorkspaces = this.getIncludedWorkspaces();

    for (const workspace of includedWorkspaces) {
      this.workspacesByPkgName.set(workspace.pkgName, workspace);
      this.workspacesByDir.set(workspace.dir, workspace);
    }

    const sorted = graphSequencer(
      this.workspaceGraph,
      Array.from(this.workspacesByDir.keys()).filter(dir => this.workspaceGraph.has(dir))
    );
    const [root, rest] = partition(sorted.chunks.flat(), dir => dir === this.cwd);
    // biome-ignore lint: style/noNonNullAssertion
    return [...root, ...rest.reverse()].map(dir => this.workspacesByDir.get(dir)!);
  }

  private getListedWorkspaces() {
    return this.workspaces.map(pattern => pattern.replace(/(?<=!?)\.\//, ''));
  }

  private getIgnoredWorkspaces() {
    const ignoreWorkspaces = this.config.ignoreWorkspaces;
    if (this.isProduction) return ignoreWorkspaces.map(removeProductionSuffix);
    return ignoreWorkspaces.filter(pattern => !pattern.endsWith('!'));
  }

  private getIgnoredWorkspacePatterns() {
    const ignoredWorkspacesManifest = this.getListedWorkspaces()
      .filter(name => name.startsWith('!'))
      .map(name => name.replace(/^!/, ''));
    return [...ignoredWorkspacesManifest, ...this.getIgnoredWorkspaces()];
  }

  private getConfiguredWorkspaceKeys() {
    const initialWorkspaces = this.rawConfig?.workspaces
      ? Object.keys(this.rawConfig.workspaces)
      : [ROOT_WORKSPACE_NAME];
    const ignoreWorkspaces = this.getIgnoredWorkspaces();
    return initialWorkspaces.filter(workspaceName => !ignoreWorkspaces.includes(workspaceName));
  }

  private async getAdditionalWorkspaceNames() {
    const workspaceKeys = this.getConfiguredWorkspaceKeys();
    const patterns = workspaceKeys.filter(key => key.includes('*'));
    const dirs = workspaceKeys.filter(key => !key.includes('*'));
    const globbedDirs = await _dirGlob({ patterns, cwd: this.cwd });
    return new Set(
      [...dirs, ...globbedDirs].filter(
        name =>
          name !== ROOT_WORKSPACE_NAME &&
          !this.workspacePackages.has(name) &&
          !picomatch.isMatch(name, this.ignoredWorkspacePatterns)
      )
    );
  }

  private getAvailableWorkspaceNames(names: Iterable<string>) {
    const availableWorkspaceNames = [];
    const [ignore, patterns] = partition(this.ignoredWorkspacePatterns, pattern => pattern.startsWith('!'));
    const ignoreSliced = ignore.map(pattern => pattern.slice(1));
    for (const name of names) {
      if (!picomatch.isMatch(name, patterns, { ignore: ignoreSliced })) {
        availableWorkspaceNames.push(name);
      }
    }
    return availableWorkspaceNames;
  }

  private getIncludedWorkspaces() {
    const selectedWorkspaces = this.selectedWorkspaces;

    const isAncestor = (name: string, ancestor: string) =>
      ancestor !== name && (ancestor === ROOT_WORKSPACE_NAME || name.startsWith(`${ancestor}/`));

    const getAncestors = (name: string) => this.availableWorkspaceNames.filter(a => isAncestor(name, a));

    const workspaceNames = selectedWorkspaces
      ? Array.from(selectedWorkspaces).flatMap(name => [...getAncestors(name), name])
      : this.availableWorkspaceNames;

    const ws = new Set<string>();

    if (selectedWorkspaces && this.isStrict) {
      for (const name of selectedWorkspaces) ws.add(name);
    } else if (selectedWorkspaces && this.isNoDependents) {
      for (const name of workspaceNames) ws.add(name);
    } else if (selectedWorkspaces) {
      const graph = this.workspaceGraph;
      if (graph) {
        const seen = new Set<string>();
        const initialWorkspaces = new Set(workspaceNames.map(name => join(this.cwd, name)));
        const workspaceDirsWithDependents = new Set(initialWorkspaces);
        const addDependents = (dir: string) => {
          seen.add(dir);
          const dirs = graph.get(dir);
          if (!dirs || dirs.size === 0) return;
          for (const d of dirs)
            if (initialWorkspaces.has(d)) {
              workspaceDirsWithDependents.add(dir);
              break;
            }
          for (const dir of dirs) if (!seen.has(dir)) addDependents(dir);
        };
        for (const dir of this.availableWorkspaceDirs) addDependents(dir);
        for (const dir of workspaceDirsWithDependents) ws.add(relative(this.cwd, dir) || ROOT_WORKSPACE_NAME);
      }
    } else {
      for (const name of workspaceNames) ws.add(name);
    }

    return Array.from(ws)
      .sort(byPathDepth)
      .map((name): Workspace => {
        const dir = join(this.cwd, name);
        const pkg = this.workspacePackages.get(name);
        const pkgName = pkg?.pkgName ?? `KNIP_ADDED_${name}`;
        const manifestPath = pkg?.manifestPath ?? join(dir, 'package.json');
        const manifestStr = pkg?.manifestStr ?? '';
        const workspaceConfig = this.getWorkspaceConfig(name);
        const ignoreMembers = workspaceConfig.ignoreMembers?.map(toRegexOrString) ?? [];
        return {
          name,
          pkgName,
          dir,
          config: this.getConfigForWorkspace(name),
          ancestors: getAncestors(name),
          manifestPath,
          manifestStr,
          ignoreMembers,
        };
      });
  }

  public getManifestForWorkspace(name: string) {
    return this.workspacePackages.get(name)?.manifest;
  }

  private getDescendentWorkspaces(name: string) {
    const prefix = `${name}/`;
    return this.availableWorkspaceNames.filter(
      workspaceName => workspaceName !== name && (name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(prefix))
    );
  }

  public getIgnoredWorkspacesFor(name: string) {
    return this.ignoredWorkspacePatterns
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name));
  }

  public createIgnoredWorkspaceMatcher(name: string, dir: string) {
    const ignoredWorkspaces = this.getIgnoredWorkspacesFor(name);
    if (ignoredWorkspaces.length === 0) return () => false;
    return (filePath: string) => {
      const relativePath = filePath.startsWith(dir) ? filePath.slice(dir.length + 1) : filePath;
      return picomatch.isMatch(relativePath, ignoredWorkspaces);
    };
  }

  public getNegatedWorkspacePatterns(name: string) {
    const descendentWorkspaces = this.getDescendentWorkspaces(name);
    const matchName = new RegExp(`^${name}/`);
    const ignoredWorkspaces = this.getIgnoredWorkspacesFor(name);
    const endMatch = /\/\*{1,2}$|\/$|$/;
    return [...ignoredWorkspaces, ...descendentWorkspaces]
      .map(workspaceName => workspaceName.replace(matchName, ''))
      .map(workspaceName => `!${workspaceName.replace(endMatch, '/**')}`);
  }

  private getConfigKeyForWorkspace(workspaceName: string) {
    return this.getConfiguredWorkspaceKeys()
      .sort(byPathDepth)
      .reverse()
      .find(pattern => picomatch.isMatch(workspaceName, pattern));
  }

  private getSelectedWorkspaces() {
    if (!this.workspace) return;
    const workspaceSelectors = Array.isArray(this.workspace) ? this.workspace : [this.workspace];
    return selectWorkspaces(workspaceSelectors, this.cwd, this.workspacePackages, this.availableWorkspaceNames);
  }

  public getWorkspaceConfig(workspaceName: string) {
    const key = this.getConfigKeyForWorkspace(workspaceName);
    const workspaces = this.rawConfig?.workspaces ?? {};
    return (
      (key
        ? key === ROOT_WORKSPACE_NAME && !(ROOT_WORKSPACE_NAME in workspaces)
          ? this.rawConfig
          : workspaces[key]
        : {}) ?? {}
    );
  }

  public getIgnores(workspaceName: string) {
    const workspaceConfig = this.getWorkspaceConfig(workspaceName);
    const ignoreBinaries = workspaceConfig.ignoreBinaries ?? [];
    const ignoreDependencies = workspaceConfig.ignoreDependencies ?? [];
    const ignoreUnresolved = workspaceConfig.ignoreUnresolved ?? [];
    if (workspaceName === ROOT_WORKSPACE_NAME) {
      const {
        ignoreBinaries: rootIgnoreBinaries,
        ignoreDependencies: rootIgnoreDependencies,
        ignoreUnresolved: rootIgnoreUnresolved,
      } = this.rawConfig ?? {};
      return {
        ignoreBinaries: compact([...ignoreBinaries, ...(rootIgnoreBinaries ?? [])]),
        ignoreDependencies: compact([...ignoreDependencies, ...(rootIgnoreDependencies ?? [])]),
        ignoreUnresolved: compact([...ignoreUnresolved, ...(rootIgnoreUnresolved ?? [])]),
      };
    }
    return { ignoreBinaries, ignoreDependencies, ignoreUnresolved };
  }

  public getConfigForWorkspace(workspaceName: string, extensions?: string[]) {
    const baseConfig = getDefaultWorkspaceConfig(extensions);
    const workspaceConfig = this.getWorkspaceConfig(workspaceName);

    const entry = workspaceConfig.entry ? arrayify(workspaceConfig.entry) : baseConfig.entry;
    const project = workspaceConfig.project ? arrayify(workspaceConfig.project) : baseConfig.project;
    const paths = workspaceConfig.paths ?? {};
    const ignore = arrayify(workspaceConfig.ignore);
    const ignoreFiles = arrayify(workspaceConfig.ignoreFiles);
    const isIncludeEntryExports = workspaceConfig.includeEntryExports ?? this.config.isIncludeEntryExports;

    const plugins: Partial<PluginsConfiguration> = {};

    for (const [pluginName, pluginConfig] of Object.entries(this.config.rootPluginConfigs)) {
      if (typeof pluginConfig !== 'undefined') plugins[pluginName as PluginName] = pluginConfig;
    }

    for (const [pluginName, pluginConfig] of Object.entries(workspaceConfig)) {
      if (isPluginName(pluginName)) {
        plugins[pluginName] = normalizePluginConfig(pluginConfig as RawPluginConfiguration);
      }
    }

    return { entry, project, paths, ignore, ignoreFiles, isIncludeEntryExports, ...plugins };
  }

  public findWorkspaceByFilePath(filePath: string) {
    const workspaceDir = this.availableWorkspaceDirs.find(workspaceDir => filePath.startsWith(`${workspaceDir}/`));
    if (!workspaceDir) return undefined;
    return this.workspacesByDir.get(workspaceDir);
  }

  public getUnusedIgnoredWorkspaces() {
    const ignoredWorkspaceNames = this.config.ignoreWorkspaces.map(removeProductionSuffix);
    const matchesWorkspace = (pattern: string) => {
      for (const name of this.workspacePackages.keys()) if (picomatch.isMatch(name, pattern)) return true;
      for (const name of this.additionalWorkspaceNames) if (picomatch.isMatch(name, pattern)) return true;
      return false;
    };
    return ignoredWorkspaceNames
      .filter(ignoredWorkspaceName => !matchesWorkspace(ignoredWorkspaceName))
      .filter(ignoredWorkspaceName => {
        const dir = join(this.cwd, ignoredWorkspaceName);
        return !isDirectory(dir) || isFile(dir, 'package.json');
      });
  }
}
