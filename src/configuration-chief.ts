import path from 'node:path';
import micromatch from 'micromatch';
import { z } from 'zod';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import * as plugins from './plugins/index.js';
import { LocalConfiguration } from './types/validate.js';
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
  values: {
    config: rawConfigArg,
    workspace: rawWorkspaceArg,
    include = [],
    exclude = [],
    strict: isStrict = false,
    production: isProduction = false,
  },
} = parsedArgs;

const defaultConfig: Configuration = {
  include: [],
  exclude: [],
  ignoreBinaries: [],
  ignoreFiles: [],
  ignoreWorkspaces: [],
  workspaces: {
    [ROOT_WORKSPACE_NAME]: {
      entryFiles: ['index.{js,ts,tsx}', 'src/index.{js,ts,tsx}'],
      projectFiles: ['**/*.{js,ts,tsx}'],
      ignore: [],
      paths: {},
    },
  },
};

const PLUGIN_NAMES = Object.keys(plugins);

type ConfigurationManagerOptions = {
  cwd?: string;
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
  config: Configuration;

  manifestPath: undefined | string;
  manifest: undefined | PackageJson;

  constructor({ cwd }: ConfigurationManagerOptions) {
    this.cwd = cwd ?? this.cwd;

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
      this.config = this.normalize(LocalConfiguration.parse(rawLocalConfig));
    }
  }

  normalize(rawLocalConfig: z.infer<typeof LocalConfiguration>) {
    const workspaces = rawLocalConfig.workspaces ?? {
      [ROOT_WORKSPACE_NAME]: {
        ...rawLocalConfig,
      },
    };

    const include = rawLocalConfig.include ?? defaultConfig.include;
    const exclude = rawLocalConfig.exclude ?? defaultConfig.exclude;
    const ignoreBinaries = rawLocalConfig.ignoreBinaries ?? defaultConfig.ignoreBinaries;
    const ignoreFiles = arrayify(rawLocalConfig.ignoreFiles ?? defaultConfig.ignoreFiles);
    const ignoreWorkspaces = rawLocalConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;

    return {
      include,
      exclude,
      ignoreBinaries,
      ignoreFiles,
      ignoreWorkspaces,
      workspaces: Object.entries(workspaces)
        .filter(([workspaceName]) => !ignoreWorkspaces.includes(workspaceName))
        .reduce((workspaces, workspace) => {
          const [workspaceName, workspaceConfig] = workspace;
          const entryFiles = arrayify(workspaceConfig.entryFiles);
          workspaces[workspaceName] = {
            entryFiles,
            projectFiles: arrayify(workspaceConfig.projectFiles ?? entryFiles),
            ignore: arrayify(workspaceConfig.ignore),
            paths: workspaceConfig.paths ?? {},
          };
          for (const [pluginName, pluginConfig] of Object.entries(workspaceConfig)) {
            if (PLUGIN_NAMES.includes(pluginName)) {
              const isObject = typeof pluginConfig !== 'string' && !Array.isArray(pluginConfig);
              const config = isObject ? arrayify(pluginConfig.config) : arrayify(pluginConfig);
              const entryFiles = isObject && 'entryFiles' in pluginConfig ? arrayify(pluginConfig.entryFiles) : [];
              const projectFiles =
                isObject && 'projectFiles' in pluginConfig ? arrayify(pluginConfig.projectFiles) : entryFiles;
              workspaces[workspaceName][pluginName as PluginName] = {
                config,
                entryFiles,
                projectFiles,
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

  public async getActiveWorkspaces() {
    const manifestWorkspaces = await this.getManifestWorkspaces();

    const additionalWorkspaces = Object.keys(this.config.workspaces).filter(
      name => !name.includes('*') && !manifestWorkspaces.includes(name)
    );

    const rootWorkspace = {
      name: ROOT_WORKSPACE_NAME,
      dir: this.cwd,
      config: this.getConfigForWorkspace(ROOT_WORKSPACE_NAME),
      ancestors: [],
    };

    if (manifestWorkspaces.length === 0 && !rawWorkspaceArg) return [rootWorkspace];

    if (rawWorkspaceArg) {
      return [
        rootWorkspace,
        {
          name: rawWorkspaceArg,
          dir: path.resolve(this.cwd, rawWorkspaceArg),
          config: this.getConfigForWorkspace(rawWorkspaceArg),
          ancestors: [ROOT_WORKSPACE_NAME],
        },
      ];
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
      return this.config?.workspaces?.[key] ?? { entryFiles: [], projectFiles: [], paths: {}, ignore: [] };
    }
    return { entryFiles: [], projectFiles: [], paths: {}, ignore: [] };
  }

  resolveIncludedIssueTypes() {
    return resolveIncludedIssueTypes(include, exclude, {
      include: this.config.include ?? [],
      exclude: this.config.exclude ?? [],
      isProduction,
      isStrict,
    });
  }
}
