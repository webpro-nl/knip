// biome-ignore lint/nursery/noRestrictedImports: ignore
import path from 'node:path';
import picomatch from 'picomatch';
import type { z } from 'zod';
import { partitionCompilers } from './compilers/index.js';
import type { SyncCompilers } from './compilers/types.js';
import { DEFAULT_EXTENSIONS, KNIP_CONFIG_LOCATIONS, ROOT_WORKSPACE_NAME } from './constants.js';
import { knipConfigurationSchema } from './schema/configuration.js';
import { type PluginName, pluginNames } from './types/PluginNames.js';
import type {
  Configuration,
  IgnorePatterns,
  PluginsConfiguration,
  RawConfiguration,
  RawPluginConfiguration,
  WorkspaceConfiguration,
} from './types/config.js';
import type { ConfigurationHints } from './types/issues.js';
import type { PackageJson, WorkspacePackage } from './types/package-json.js';
import { arrayify, compact, partition } from './util/array.js';
import parsedArgValues from './util/cli-arguments.js';
import { type WorkspaceGraph, createWorkspaceGraph } from './util/create-workspace-graph.js';
import { ConfigurationError } from './util/errors.js';
import { findFile, isDirectory, isFile, loadJSON } from './util/fs.js';
import { type CLIArguments, getIncludedIssueTypes } from './util/get-included-issue-types.js';
import { _dirGlob, removeProductionSuffix } from './util/glob.js';
import { graphSequencer } from './util/graph-sequencer.js';
import { defaultRules } from './util/issue-initializers.js';
import { _load } from './util/loader.js';
import mapWorkspaces from './util/map-workspaces.js';
import { getKeysByValue } from './util/object.js';
import { isAbsolute, join, relative } from './util/path.js';
import { normalizePluginConfig } from './util/plugin.js';
import { toRegexOrString } from './util/regex.js';
import { ELLIPSIS } from './util/string.js';
import { splitTags } from './util/tag.js';
import { unwrapFunction } from './util/unwrap-function.js';
import { byPathDepth } from './util/workspace.js';

const { config: rawConfigArg } = parsedArgValues;

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
  rules: defaultRules,
  include: [],
  exclude: [],
  ignore: [],
  ignoreBinaries: [],
  ignoreDependencies: [],
  ignoreMembers: [],
  ignoreExportsUsedInFile: false,
  ignoreWorkspaces: [],
  isIncludeEntryExports: false,
  isTreatConfigHintsAsErrors: false,
  syncCompilers: new Map(),
  asyncCompilers: new Map(),
  rootPluginConfigs: {},
  tags: [],
};

type ConfigurationManagerOptions = {
  cwd: string;
  isProduction: boolean;
  isStrict: boolean;
  isIncludeEntryExports: boolean;
  workspace: string | undefined;
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
 * - Loads package.json
 * - Loads knip.json/jsonc
 * - Normalizes raw local config
 * - Determines workspaces to analyze
 * - Determines issue types to report (--include/--exclude)
 * - Hands out workspace and plugin configs
 */
export class ConfigurationChief {
  cwd: string;
  isProduction = false;
  isStrict = false;
  isIncludeEntryExports = false;
  config: Configuration;
  workspace: string | undefined;

  manifestPath?: string;
  manifest?: PackageJson;

  ignoredWorkspacePatterns: string[] = [];
  workspacePackages = new Map<string, WorkspacePackage>();
  workspacesByPkgName = new Map<string, Workspace>();
  workspacesByName = new Map<string, Workspace>();
  additionalWorkspaceNames = new Set<string>();
  availableWorkspaceNames: string[] = [];
  availableWorkspacePkgNames = new Set<string>();
  availableWorkspaceDirs: string[] = [];
  workspaceGraph: WorkspaceGraph = new Map();
  includedWorkspaces: Workspace[] = [];

  resolvedConfigFilePath?: string;

  rawConfig?: any;
  parsedConfig?: z.infer<typeof knipConfigurationSchema>;

  constructor({ cwd, isProduction, isStrict, isIncludeEntryExports, workspace }: ConfigurationManagerOptions) {
    this.cwd = cwd;
    this.isProduction = isProduction;
    this.isStrict = isStrict;
    this.isIncludeEntryExports = isIncludeEntryExports;
    this.config = defaultConfig;
    this.workspace = workspace;
  }

  public async init() {
    const manifestPath = findFile(this.cwd, 'package.json');
    const manifest = manifestPath && (await loadJSON(manifestPath));

    if (!(manifestPath && manifest)) {
      throw new ConfigurationError('Unable to find package.json');
    }

    this.manifestPath = manifestPath;
    this.manifest = manifest;

    const pnpmWorkspacesPath = findFile(this.cwd, 'pnpm-workspace.yaml');
    const pnpmWorkspaces = pnpmWorkspacesPath && (await _load(pnpmWorkspacesPath));

    if (this.manifest && pnpmWorkspaces) {
      this.manifest.workspaces = pnpmWorkspaces;
    }

    for (const configPath of rawConfigArg ? [rawConfigArg] : KNIP_CONFIG_LOCATIONS) {
      this.resolvedConfigFilePath = isAbsolute(configPath) ? configPath : findFile(this.cwd, configPath);
      if (this.resolvedConfigFilePath) break;
    }

    if (rawConfigArg && !this.resolvedConfigFilePath && !manifest.knip) {
      throw new ConfigurationError(`Unable to find ${rawConfigArg} or package.json#knip`);
    }

    this.rawConfig = this.resolvedConfigFilePath
      ? await this.loadResolvedConfigurationFile(this.resolvedConfigFilePath)
      : manifest.knip;

    // Have to partition compiler functions before Zod touches them
    this.parsedConfig = this.rawConfig ? knipConfigurationSchema.parse(partitionCompilers(this.rawConfig)) : {};

    this.config = this.normalize(this.parsedConfig);

    await this.setWorkspaces();
  }

  public getConfigurationHints() {
    const hints: ConfigurationHints = new Set();
    const config = this.parsedConfig;
    if (config) {
      if (this.workspacePackages.size > 1) {
        const entry = arrayify(config.entry);
        if (entry.length > 0) {
          const identifier = `[${entry[0]}${entry.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
          hints.add({ type: 'entry-top-level', identifier });
        }
        const project = arrayify(config.project);
        if (project.length > 0) {
          const identifier = `[${project[0]}${project.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
          hints.add({ type: 'project-top-level', identifier });
        }
      }
    }
    return hints;
  }

  private async loadResolvedConfigurationFile(configPath: string) {
    const loadedValue = await _load(configPath);
    try {
      return await unwrapFunction(loadedValue);
    } catch (_error) {
      throw new ConfigurationError(`Error running the function from ${configPath}`);
    }
  }

  public getRules() {
    return this.config.rules;
  }

  public getFilters() {
    if (this.workspaceGraph && this.workspace) return { dir: join(this.cwd, this.workspace) };
    return {};
  }

  private normalize(rawConfig: RawConfiguration) {
    const rules = { ...defaultRules, ...rawConfig.rules };
    const include = rawConfig.include ?? defaultConfig.include;
    const exclude = rawConfig.exclude ?? defaultConfig.exclude;
    const ignore = arrayify(rawConfig.ignore ?? defaultConfig.ignore);
    const ignoreBinaries = rawConfig.ignoreBinaries ?? [];
    const ignoreDependencies = rawConfig.ignoreDependencies ?? [];
    const ignoreMembers = rawConfig.ignoreMembers ?? [];
    const ignoreExportsUsedInFile = rawConfig.ignoreExportsUsedInFile ?? false;
    const ignoreWorkspaces = rawConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;
    const isIncludeEntryExports = rawConfig.includeEntryExports ?? this.isIncludeEntryExports;
    const isTreatConfigHintsAsErrors = rawConfig.treatConfigHintsAsErrors ?? defaultConfig.isTreatConfigHintsAsErrors;

    const { syncCompilers, asyncCompilers } = rawConfig;

    const rootPluginConfigs: Partial<PluginsConfiguration> = {};

    for (const [pluginName, pluginConfig] of Object.entries(rawConfig)) {
      if (isPluginName(pluginName)) {
        rootPluginConfigs[pluginName] = normalizePluginConfig(pluginConfig as RawPluginConfiguration);
      }
    }

    return {
      rules,
      include,
      exclude,
      ignore,
      ignoreBinaries,
      ignoreDependencies,
      ignoreMembers,
      ignoreExportsUsedInFile,
      ignoreWorkspaces,
      isIncludeEntryExports,
      syncCompilers: new Map(Object.entries(syncCompilers ?? {})) as SyncCompilers,
      asyncCompilers: new Map(Object.entries(asyncCompilers ?? {})),
      rootPluginConfigs,
      tags: rawConfig.tags ?? [],
      isTreatConfigHintsAsErrors,
    };
  }

  private async setWorkspaces() {
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

    this.includedWorkspaces = this.getIncludedWorkspaces();

    for (const workspace of this.includedWorkspaces) {
      this.workspacesByPkgName.set(workspace.pkgName, workspace);
      this.workspacesByName.set(workspace.name, workspace);
    }
  }

  private getListedWorkspaces() {
    const workspaces = this.manifest?.workspaces
      ? Array.isArray(this.manifest.workspaces)
        ? this.manifest.workspaces
        : (this.manifest.workspaces.packages ?? [])
      : [];
    return workspaces.map(pattern => pattern.replace(/(?<=!?)\.\//, ''));
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
    for (const name of names) {
      if (!picomatch.isMatch(name, this.ignoredWorkspacePatterns)) availableWorkspaceNames.push(name);
    }
    return availableWorkspaceNames;
  }

  private getIncludedWorkspaces() {
    if (this.workspace) {
      const dir = path.resolve(this.cwd, this.workspace);
      if (!isDirectory(dir)) throw new ConfigurationError('Workspace is not a directory');
      if (!isFile(join(dir, 'package.json'))) throw new ConfigurationError('Unable to find package.json in workspace');
    }

    const getAncestors = (name: string) => (ancestors: string[], ancestorName: string) => {
      if (name === ancestorName) return ancestors;
      if (ancestorName === ROOT_WORKSPACE_NAME || name.startsWith(`${ancestorName}/`)) ancestors.push(ancestorName);
      return ancestors;
    };

    const workspaceNames = this.workspace
      ? [...this.availableWorkspaceNames.reduce(getAncestors(this.workspace), []), this.workspace]
      : this.availableWorkspaceNames;

    const ws = new Set<string>();

    if (this.workspace && this.isStrict) {
      ws.add(this.workspace);
    } else if (this.workspace) {
      const graph = this.workspaceGraph;
      if (graph) {
        const seen = new Set<string>();
        const initialWorkspaces = workspaceNames.map(name => join(this.cwd, name));
        const workspaceDirsWithDependents = new Set(initialWorkspaces);
        const addDependents = (dir: string) => {
          seen.add(dir);
          const dirs = graph.get(dir);
          if (!dirs || dirs.size === 0) return;
          if (initialWorkspaces.some(dir => dirs.has(dir))) workspaceDirsWithDependents.add(dir);
          for (const dir of dirs) if (!seen.has(dir)) addDependents(dir);
        };
        this.availableWorkspaceDirs.forEach(addDependents);
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
        const ignoreMembers = arrayify(workspaceConfig.ignoreMembers).map(toRegexOrString);
        return {
          name,
          pkgName,
          dir,
          config: this.getConfigForWorkspace(name),
          ancestors: this.availableWorkspaceNames.reduce(getAncestors(name), []),
          manifestPath,
          manifestStr,
          ignoreMembers,
        };
      });
  }

  public getManifestForWorkspace(name: string) {
    return this.workspacePackages.get(name)?.manifest;
  }

  public getWorkspaces(): Workspace[] {
    const sorted = graphSequencer(
      this.workspaceGraph,
      this.includedWorkspaces.map(workspace => workspace.dir)
    );
    const [root, rest] = partition(sorted.chunks.flat(), dir => dir === this.cwd);
    // biome-ignore lint/style/noNonNullAssertion: deal with it
    return [...root, ...rest.reverse()].map(dir => this.includedWorkspaces.find(w => w.dir === dir)!);
  }

  private getDescendentWorkspaces(name: string) {
    return this.availableWorkspaceNames
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(`${name}/`));
  }

  public getIgnoredWorkspacesFor(name: string) {
    return this.ignoredWorkspacePatterns
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name));
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
    const ignoreBinaries = arrayify(workspaceConfig.ignoreBinaries);
    const ignoreDependencies = arrayify(workspaceConfig.ignoreDependencies);
    const ignoreUnresolved = arrayify(workspaceConfig.ignoreUnresolved);
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

    return { entry, project, paths, ignore, isIncludeEntryExports, ...plugins };
  }

  public getIncludedIssueTypes(cliArgs: CLIArguments) {
    const excludesFromRules = getKeysByValue(this.config.rules, 'off');
    const config = {
      include: this.config.include ?? [],
      exclude: [...excludesFromRules, ...this.config.exclude],
      isProduction: this.isProduction,
    };
    return getIncludedIssueTypes(cliArgs, config);
  }

  public findWorkspaceByFilePath(filePath: string) {
    const workspaceDir = this.availableWorkspaceDirs.find(workspaceDir => filePath.startsWith(`${workspaceDir}/`));
    return this.includedWorkspaces.find(workspace => workspace.dir === workspaceDir);
  }

  public getUnusedIgnoredWorkspaces() {
    const ignoredWorkspaceNames = this.config.ignoreWorkspaces.map(removeProductionSuffix);
    const workspaceNames = [...this.workspacePackages.keys(), ...this.additionalWorkspaceNames];
    return ignoredWorkspaceNames
      .filter(ignoredWorkspaceName => !workspaceNames.some(name => picomatch.isMatch(name, ignoredWorkspaceName)))
      .filter(ignoredWorkspaceName => {
        const dir = join(this.cwd, ignoredWorkspaceName);
        return !isDirectory(dir) || isFile(join(dir, 'package.json'));
      });
  }

  public getTags() {
    return splitTags(this.config.tags);
  }
}
