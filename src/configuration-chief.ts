import path from 'node:path';
import micromatch from 'micromatch';
import { z } from 'zod';
import { ConfigurationValidator } from './configuration-validator.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import * as plugins from './plugins/index.js';
import { arrayify } from './util/array.js';
import { ConfigurationError } from './util/errors.js';
import { findFile, loadJSON } from './util/fs.js';
import { _dirGlob } from './util/glob.js';
import parsedArgs from './util/parseArgs.js';
import { resolveIncludedIssueTypes } from './util/resolveIncludedIssueTypes.js';
import { workspaceSorter } from './util/sort.js';
import type { Configuration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { PackageJson } from 'type-fest';

const {
  values: { config: rawConfigArg, workspace: rawWorkspaceArg, include = [], exclude = [] },
} = parsedArgs;

const defaultConfig: Configuration = {
  include: [],
  exclude: [],
  ignore: [],
  ignoreBinaries: [],
  ignoreWorkspaces: [],
  workspaces: {
    [ROOT_WORKSPACE_NAME]: {
      entry: ['index.{js,ts,tsx}', 'src/index.{js,ts,tsx}'],
      project: ['**/*.{js,ts,tsx}'],
      ignore: [],
    },
  },
};

const PLUGIN_NAMES = Object.keys(plugins);

type ConfigurationManagerOptions = {
  cwd?: string;
  isStrict: boolean;
  isProduction: boolean;
};

/**
 * - Loads package.json
 * - Loads knip.json
 * - Normalizes raw local config
 * - Determines workspaces to analyze
 * - Determines issue types to report
 * - Hands out workspace and plugin configs
 */
export default class ConfigurationChief {
  cwd: string = process.cwd();
  isStrict = false;
  isProduction = false;
  config: Configuration;

  manifestPath: undefined | string;
  manifest: undefined | PackageJson;

  constructor({ cwd, isStrict, isProduction }: ConfigurationManagerOptions) {
    this.cwd = cwd ?? this.cwd;
    this.isStrict = isStrict;
    this.isProduction = isProduction;

    this.config = defaultConfig;
  }

  async loadLocalConfig() {
    const manifestPath = await findFile(this.cwd, 'package.json');
    const manifest = manifestPath && (await loadJSON(manifestPath));

    if (!manifestPath || !manifest) {
      throw new ConfigurationError('Unable to find package.json');
    }

    this.manifestPath = manifestPath;
    this.manifest = manifest;

    const configFilePath = rawConfigArg ?? 'knip.json';

    const resolvedConfigFilePath =
      (await findFile(this.cwd, configFilePath)) ?? (!rawConfigArg && (await findFile(this.cwd, configFilePath + 'c')));

    if (rawConfigArg && !resolvedConfigFilePath && !manifest.knip) {
      throw new ConfigurationError(`Unable to find ${rawConfigArg} or package.json#knip`);
    }

    const rawLocalConfig = resolvedConfigFilePath ? await loadJSON(resolvedConfigFilePath) : manifest.knip;

    if (rawLocalConfig) {
      this.config = this.normalize(ConfigurationValidator.parse(rawLocalConfig));
    }
  }

  normalize(rawLocalConfig: z.infer<typeof ConfigurationValidator>) {
    const workspaces = rawLocalConfig.workspaces ?? {
      [ROOT_WORKSPACE_NAME]: {
        ...rawLocalConfig,
      },
    };

    const include = rawLocalConfig.include ?? defaultConfig.include;
    const exclude = rawLocalConfig.exclude ?? defaultConfig.exclude;
    const ignoreBinaries = rawLocalConfig.ignoreBinaries ?? defaultConfig.ignoreBinaries;
    const ignore = arrayify(rawLocalConfig.ignore ?? defaultConfig.ignore);
    const ignoreWorkspaces = rawLocalConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;

    return {
      include,
      exclude,
      ignoreBinaries,
      ignore,
      ignoreWorkspaces,
      workspaces: Object.entries(workspaces)
        .filter(([workspaceName]) => !ignoreWorkspaces.includes(workspaceName))
        .reduce((workspaces, workspace) => {
          const [workspaceName, workspaceConfig] = workspace;
          const entry = arrayify(workspaceConfig.entry);
          workspaces[workspaceName] = {
            entry,
            project: arrayify(workspaceConfig.project ?? entry),
            ignore: arrayify(workspaceConfig.ignore),
          };
          for (const [pluginName, pluginConfig] of Object.entries(workspaceConfig)) {
            if (PLUGIN_NAMES.includes(pluginName)) {
              const isObject = typeof pluginConfig !== 'string' && !Array.isArray(pluginConfig);
              const config = isObject ? arrayify(pluginConfig.config) : arrayify(pluginConfig);
              const entry = isObject && 'entry' in pluginConfig ? arrayify(pluginConfig.entry) : [];
              const project = isObject && 'project' in pluginConfig ? arrayify(pluginConfig.project) : entry;
              workspaces[workspaceName][pluginName as PluginName] = {
                config,
                entry,
                project,
              };
            }
          }
          return workspaces;
        }, {} as Record<string, WorkspaceConfiguration>),
    };
  }

  private async getManifestWorkspaces() {
    const { workspaces } = this.manifest ?? {};
    const patterns = workspaces ? (Array.isArray(workspaces) ? workspaces : workspaces.packages ?? []) : [];
    return _dirGlob({ patterns, cwd: this.cwd, ignore: this.config.ignoreWorkspaces });
  }

  private getConfiguredWorkspaces() {
    return this.config.workspaces ? Object.keys(this.config.workspaces) : [];
  }

  getAdditionalWorkspaces(manifestWorkspaces: string[]) {
    return Object.keys(this.config.workspaces).filter(
      name => !name.includes('*') && !manifestWorkspaces.includes(name)
    );
  }

  public async getActiveWorkspaces() {
    const manifestWorkspaces = await this.getManifestWorkspaces();

    const additionalWorkspaces = this.getAdditionalWorkspaces(manifestWorkspaces);

    const rootWorkspace = {
      name: ROOT_WORKSPACE_NAME,
      dir: this.cwd,
      config: this.getConfigForWorkspace(ROOT_WORKSPACE_NAME),
      ancestors: [],
    };

    const isOnlyRootWorkspace =
      (manifestWorkspaces.length === 0 && !rawWorkspaceArg) ||
      (rawWorkspaceArg && ['.', './'].includes(rawWorkspaceArg));

    if (isOnlyRootWorkspace) return [rootWorkspace];

    if (rawWorkspaceArg) {
      const workspace = {
        name: rawWorkspaceArg,
        dir: path.resolve(this.cwd, rawWorkspaceArg),
        config: this.getConfigForWorkspace(rawWorkspaceArg),
        ancestors: [ROOT_WORKSPACE_NAME],
      };
      return this.hasConfigForWorkspace('.') ? [rootWorkspace, workspace] : [workspace];
    }

    const workspaces = [...manifestWorkspaces, ...additionalWorkspaces];
    const activeWorkspaces = workspaces.filter(workspaceName => this.hasConfigForWorkspace(workspaceName));

    // Return intersection: package.json#workspaces with a match in knip.config#workspaces
    // Also return the additional configured workspaces in knip.json that are not in package.json#workspaces
    return activeWorkspaces.sort(workspaceSorter).map(name => ({
      name,
      dir: path.resolve(this.cwd, name),
      config: this.getConfigForWorkspace(name),
      ancestors: activeWorkspaces.reduce((ancestors, ancestorName) => {
        if (name === ancestorName) return ancestors;
        if (ancestorName === ROOT_WORKSPACE_NAME || name.startsWith(ancestorName)) {
          if (this.hasConfigForWorkspace(ancestorName)) {
            ancestors.push(ancestorName);
          }
        }
        return ancestors;
      }, [] as string[]),
    }));
  }

  async getNegatedWorkspacePatterns() {
    const manifestWorkspaces = await this.getManifestWorkspaces();
    const additionalWorkspaces = this.getAdditionalWorkspaces(manifestWorkspaces);
    return [...manifestWorkspaces, ...additionalWorkspaces]
      .filter(workspaceName => workspaceName !== ROOT_WORKSPACE_NAME)
      .map(workspaceName => `!${workspaceName}`);
  }

  private getConfigKeyForWorkspace(workspaceName: string) {
    const configuredWorkspaces = this.getConfiguredWorkspaces();
    return configuredWorkspaces
      .sort(workspaceSorter)
      .reverse()
      .find(pattern => micromatch.isMatch(workspaceName, pattern));
  }

  private hasConfigForWorkspace(workspaceName: string) {
    return Boolean(this.getConfigKeyForWorkspace(workspaceName));
  }

  getConfigForWorkspace(workspaceName: string) {
    const key = this.getConfigKeyForWorkspace(workspaceName);
    if (key) {
      return this.config?.workspaces?.[key] ?? { entry: [], project: [], ignore: [] };
    }
    return { entry: [], project: [], ignore: [] };
  }

  resolveIncludedIssueTypes() {
    return resolveIncludedIssueTypes(include, exclude, {
      include: this.config.include ?? [],
      exclude: this.config.exclude ?? [],
      isProduction: this.isProduction,
      isStrict: this.isStrict,
    });
  }
}
