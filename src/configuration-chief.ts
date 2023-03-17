import mapWorkspaces from '@npmcli/map-workspaces';
import micromatch from 'micromatch';
import { ConfigurationValidator } from './configuration-validator.js';
import { ROOT_WORKSPACE_NAME, DEFAULT_EXTENSIONS, KNIP_CONFIG_LOCATIONS } from './constants.js';
import * as plugins from './plugins/index.js';
import { arrayify, compact } from './util/array.js';
import parsedArgs from './util/cli-arguments.js';
import { partitionCompilers } from './util/compilers.js';
import { ConfigurationError } from './util/errors.js';
import { findFile, loadJSON } from './util/fs.js';
import { getIncludedIssueTypes } from './util/get-included-issue-types.js';
import { _dirGlob } from './util/glob.js';
import { _load } from './util/loader.js';
import { join, relative } from './util/path.js';
import { toCamelCase } from './util/plugin.js';
import { byPathDepth } from './util/workspace.js';
import type { SyncCompilers, AsyncCompilers } from './types/compilers.js';
import type { RawConfiguration, Configuration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { PackageJson } from '@npmcli/package-json';

const {
  config: rawConfigArg,
  workspace: rawWorkspaceArg,
  include = [],
  exclude = [],
  dependencies = false,
  exports = false,
} = parsedArgs.values;

const getDefaultWorkspaceConfig = (extensions?: string[]): WorkspaceConfiguration => {
  const exts = [...DEFAULT_EXTENSIONS, ...(extensions ?? [])].map(ext => ext.slice(1)).join(',');

  return {
    entry: [`index.{${exts}}!`, `src/index.{${exts}}!`],
    project: [`**/*.{${exts}}!`],
    paths: {},
    ignore: [],
    ignoreBinaries: [],
    ignoreDependencies: [],
  };
};

const defaultConfig: Configuration = {
  include: [],
  exclude: [],
  ignore: [],
  ignoreWorkspaces: [],
  syncCompilers: new Map(),
  asyncCompilers: new Map(),
  workspaces: {
    [ROOT_WORKSPACE_NAME]: getDefaultWorkspaceConfig(),
  },
};

const PLUGIN_NAMES = Object.keys(plugins);

type ConfigurationManagerOptions = {
  cwd: string;
  isProduction: boolean;
};

export type Workspace = {
  name: string;
  pkgName?: string;
  dir: string;
  ancestors: string[];
  config: WorkspaceConfiguration;
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
  config: Configuration;

  manifestPath?: string;
  manifest?: PackageJson;

  ignoreWorkspaces: string[] = [];
  manifestWorkspaces: Map<string, string> = new Map();
  additionalWorkspaces: Set<string> = new Set();
  workspaceDirs: string[] = [];
  workspaces: Workspace[] = [];

  resolvedConfigFilePath?: string;

  constructor({ cwd, isProduction }: ConfigurationManagerOptions) {
    this.cwd = cwd;
    this.isProduction = isProduction;
    this.config = defaultConfig;
  }

  async init() {
    const manifestPath = findFile(this.cwd, 'package.json');
    const manifest = manifestPath && (await loadJSON(manifestPath));

    if (!manifestPath || !manifest) {
      throw new ConfigurationError('Unable to find package.json');
    }

    this.manifestPath = manifestPath;
    this.manifest = manifest;

    const pnpmWorkspacesPath = findFile(this.cwd, 'pnpm-workspace.yaml');
    const pnpmWorkspaces = pnpmWorkspacesPath && (await _load(pnpmWorkspacesPath));

    if (this.manifest && !this.manifest.workspaces && pnpmWorkspaces) {
      this.manifest.workspaces = pnpmWorkspaces;
    }

    for (const configPath of rawConfigArg ? [rawConfigArg] : KNIP_CONFIG_LOCATIONS) {
      this.resolvedConfigFilePath = findFile(this.cwd, configPath);
      if (this.resolvedConfigFilePath) break;
    }

    if (rawConfigArg && !this.resolvedConfigFilePath && !manifest.knip) {
      throw new ConfigurationError(`Unable to find ${rawConfigArg} or package.json#knip`);
    }

    const rawLocalConfig = this.resolvedConfigFilePath ? await _load(this.resolvedConfigFilePath) : manifest.knip;

    if (rawLocalConfig) {
      // Have to partition compiler functions before Zod touches them
      const parsedConfig = ConfigurationValidator.parse(partitionCompilers(rawLocalConfig));
      this.config = this.normalize(parsedConfig);
    }

    await this.setWorkspaces();
  }

  getCompilers(): [SyncCompilers, AsyncCompilers] {
    return [this.config.syncCompilers, this.config.asyncCompilers];
  }

  normalize(rawLocalConfig: RawConfiguration) {
    const workspaces = rawLocalConfig.workspaces ?? {
      [ROOT_WORKSPACE_NAME]: {
        ...rawLocalConfig,
      },
    };

    const include = rawLocalConfig.include ?? defaultConfig.include;
    const exclude = rawLocalConfig.exclude ?? defaultConfig.exclude;
    const ignore = arrayify(rawLocalConfig.ignore ?? defaultConfig.ignore);
    const ignoreBinaries = rawLocalConfig.ignoreBinaries ?? [];
    const ignoreDependencies = rawLocalConfig.ignoreDependencies ?? [];
    const ignoreWorkspaces = rawLocalConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;

    const { syncCompilers, asyncCompilers } = rawLocalConfig;

    const extensions = [...Object.keys(syncCompilers ?? {}), ...Object.keys(asyncCompilers ?? {})];

    const defaultWorkspaceConfig = getDefaultWorkspaceConfig(extensions);

    return {
      include,
      exclude,
      ignore,
      ignoreWorkspaces,
      syncCompilers: new Map(Object.entries(syncCompilers ?? {})),
      asyncCompilers: new Map(Object.entries(asyncCompilers ?? {})),
      workspaces: Object.entries(workspaces)
        .filter(([workspaceName]) => !ignoreWorkspaces.includes(workspaceName))
        .reduce((workspaces, workspace) => {
          const [workspaceName, workspaceConfig] = workspace;

          const entry = workspaceConfig.entry ? arrayify(workspaceConfig.entry) : defaultWorkspaceConfig.entry;
          const project = workspaceConfig.project ? arrayify(workspaceConfig.project) : defaultWorkspaceConfig.project;
          const paths = workspaceConfig.paths ?? defaultWorkspaceConfig.paths;

          workspaces[workspaceName] = {
            entry,
            project,
            paths,
            ignore: arrayify(workspaceConfig.ignore),
            ignoreBinaries: compact([...ignoreBinaries, ...arrayify(workspaceConfig.ignoreBinaries)]),
            ignoreDependencies: compact([...ignoreDependencies, ...arrayify(workspaceConfig.ignoreDependencies)]),
          };

          for (const [name, pluginConfig] of Object.entries(workspaceConfig)) {
            const pluginName = toCamelCase(name) as PluginName;
            if (PLUGIN_NAMES.includes(pluginName)) {
              if (pluginConfig === false) {
                workspaces[workspaceName][pluginName] = false;
              } else {
                const isObject = typeof pluginConfig !== 'string' && !Array.isArray(pluginConfig);
                const config = isObject ? arrayify(pluginConfig.config) : pluginConfig ? arrayify(pluginConfig) : null;
                const entry = isObject && 'entry' in pluginConfig ? arrayify(pluginConfig.entry) : null;
                const project = isObject && 'project' in pluginConfig ? arrayify(pluginConfig.project) : entry;
                workspaces[workspaceName][pluginName] = {
                  config,
                  entry,
                  project,
                };
              }
            }
          }
          return workspaces;
        }, {} as Record<string, WorkspaceConfiguration>),
    };
  }

  async setWorkspaces() {
    this.ignoreWorkspaces = this.getIgnoredWorkspaces();
    this.manifestWorkspaces = await this.getManifestWorkspaces();
    this.additionalWorkspaces = await this.getAdditionalWorkspaces();
    this.workspaces = this.getEnabledWorkspaces();
    this.workspaceDirs = this.getAllWorkspaces()
      .sort(byPathDepth)
      .reverse()
      .map(dir => join(this.cwd, dir));
  }

  private async getManifestWorkspaces() {
    const workspaces = await mapWorkspaces({
      pkg: this.manifest ?? {},
      cwd: this.cwd,
      ignore: this.config.ignoreWorkspaces,
    });

    const manifestWorkspaces = new Map();
    for (const [pkgName, dir] of workspaces.entries()) {
      manifestWorkspaces.set(relative(this.cwd, dir), pkgName);
    }
    return manifestWorkspaces;
  }

  private async getAdditionalWorkspaces() {
    const additionalWorkspaceKeys = Object.keys(this.config.workspaces);
    const patterns = additionalWorkspaceKeys.filter(key => key.includes('*'));
    const dirs = additionalWorkspaceKeys.filter(key => !key.includes('*'));
    const globbedDirs = await _dirGlob({ patterns, cwd: this.cwd });
    return new Set(
      [...dirs, ...globbedDirs].filter(
        name =>
          name !== ROOT_WORKSPACE_NAME && !this.manifestWorkspaces.has(name) && !this.ignoreWorkspaces.includes(name)
      )
    );
  }

  private getAllWorkspaces() {
    return compact([ROOT_WORKSPACE_NAME, ...this.manifestWorkspaces.keys(), ...this.additionalWorkspaces]);
  }

  public getEnabledWorkspaces() {
    const allWorkspaces = this.getAllWorkspaces();
    const workspace = (rawWorkspaceArg ?? '').replace(/\/$/, '');

    const getAncestors = (name: string) => (ancestors: string[], ancestorName: string) => {
      if (name === ancestorName) return ancestors;
      if (ancestorName === ROOT_WORKSPACE_NAME || name.startsWith(ancestorName + '/')) ancestors.push(ancestorName);
      return ancestors;
    };

    const workspaces = rawWorkspaceArg
      ? [workspace, ...allWorkspaces.reduce(getAncestors(workspace), [] as string[])]
      : allWorkspaces;

    return workspaces.sort(byPathDepth).map(
      (name): Workspace => ({
        name,
        pkgName: this.manifestWorkspaces.get(name) ?? this.manifest?.name,
        dir: join(this.cwd, name),
        config: this.getConfigForWorkspace(name),
        ancestors: allWorkspaces.reduce(getAncestors(name), [] as string[]),
      })
    );
  }

  getDescendentWorkspaces(name: string) {
    return this.getAllWorkspaces()
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name));
  }

  getIgnoredWorkspaces() {
    const ignored = this.config.ignoreWorkspaces;
    const workspaces = this.manifest?.workspaces
      ? Array.isArray(this.manifest.workspaces)
        ? this.manifest.workspaces
        : this.manifest.workspaces.packages ?? []
      : [];
    return [...ignored, ...workspaces.filter(name => name.startsWith('!'))].map(name => name.replace(/^!/, ''));
  }

  getIgnoredWorkspacesFor(name: string) {
    return this.getIgnoredWorkspaces()
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name));
  }

  getNegatedWorkspacePatterns(name: string) {
    const descendentWorkspaces = this.getDescendentWorkspaces(name);
    const matchName = new RegExp(`^${name}/`);
    const ignoredWorkspaces = this.getIgnoredWorkspacesFor(name);
    return [...ignoredWorkspaces, ...descendentWorkspaces]
      .map(workspaceName => workspaceName.replace(matchName, ''))
      .map(workspaceName => `!${workspaceName}`);
  }

  private getConfigKeyForWorkspace(workspaceName: string) {
    return Object.keys(this.config.workspaces)
      .sort(byPathDepth)
      .reverse()
      .find(pattern => micromatch.isMatch(workspaceName, pattern));
  }

  getConfigForWorkspace(workspaceName: string) {
    const key = this.getConfigKeyForWorkspace(workspaceName);
    if (key && this.config?.workspaces?.[key]) return this.config.workspaces[key];
    return getDefaultWorkspaceConfig();
  }

  getIssueTypesToReport() {
    const cliArgs = { include, exclude, dependencies, exports };
    const config = {
      include: this.config.include ?? [],
      exclude: this.config.exclude ?? [],
      isProduction: this.isProduction,
    };
    return getIncludedIssueTypes(cliArgs, config);
  }

  findWorkspaceByFilePath(filePath: string) {
    const workspaceDir = this.workspaceDirs.find(workspaceDir => filePath.startsWith(workspaceDir + '/'));
    return this.workspaces.find(workspace => workspace.dir === workspaceDir);
  }

  findWorkspaceByPackageName(packageName: string) {
    return this.workspaces.find(workspace => workspace.pkgName === packageName);
  }
}
