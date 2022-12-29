import path from 'node:path';
import mapWorkspaces from '@npmcli/map-workspaces';
import micromatch from 'micromatch';
import { z } from 'zod';
import { ConfigurationValidator } from './configuration-validator.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import * as plugins from './plugins/index.js';
import { arrayify } from './util/array.js';
import { ConfigurationError } from './util/errors.js';
import { findFile, loadJSON } from './util/fs.js';
import { ensurePosixPath } from './util/glob.js';
import parsedArgs from './util/parseArgs.js';
import { resolveIncludedIssueTypes } from './util/resolve-included-issue-types.js';
import { byPathDepth } from './util/workspace.js';
import type { Configuration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { PackageJson } from '@npmcli/package-json';

const {
  values: { config: rawConfigArg, workspace: rawWorkspaceArg, include = [], exclude = [] },
} = parsedArgs;

const defaultWorkspaceConfig: WorkspaceConfiguration = {
  entry: ['index.{js,ts,tsx}!', 'src/index.{js,ts,tsx}!'],
  project: ['**/*.{js,ts,tsx}!'],
  ignore: [],
};

const defaultConfig: Configuration = {
  include: [],
  exclude: [],
  ignore: [],
  ignoreBinaries: [],
  ignoreDependencies: [],
  ignoreWorkspaces: [],
  workspaces: {
    [ROOT_WORKSPACE_NAME]: defaultWorkspaceConfig,
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
  manifestWorkspaces: undefined | string[];

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
    const ignore = arrayify(rawLocalConfig.ignore ?? defaultConfig.ignore);
    const ignoreBinaries = rawLocalConfig.ignoreBinaries ?? defaultConfig.ignoreBinaries;
    const ignoreDependencies = rawLocalConfig.ignoreDependencies ?? defaultConfig.ignoreDependencies;
    const ignoreWorkspaces = rawLocalConfig.ignoreWorkspaces ?? defaultConfig.ignoreWorkspaces;

    return {
      include,
      exclude,
      ignore,
      ignoreBinaries,
      ignoreDependencies,
      ignoreWorkspaces,
      workspaces: Object.entries(workspaces)
        .filter(([workspaceName]) => !ignoreWorkspaces.includes(workspaceName))
        .reduce((workspaces, workspace) => {
          const [workspaceName, workspaceConfig] = workspace;

          const entry = workspaceConfig.entry ? arrayify(workspaceConfig.entry) : defaultWorkspaceConfig.entry;
          workspaces[workspaceName] = {
            entry,
            project: workspaceConfig.project
              ? arrayify(workspaceConfig.project)
              : workspaceConfig.entry
              ? entry
              : defaultWorkspaceConfig.project,
            ignore: arrayify(workspaceConfig.ignore),
          };

          for (const [pluginName, pluginConfig] of Object.entries(workspaceConfig)) {
            if (PLUGIN_NAMES.includes(pluginName)) {
              if (pluginConfig === false) {
                workspaces[workspaceName][pluginName as PluginName] = false;
              } else {
                const isObject = typeof pluginConfig !== 'string' && !Array.isArray(pluginConfig);
                const config =
                  typeof pluginConfig === 'string' ? [pluginConfig] : isObject ? arrayify(pluginConfig.config) : null;
                const entry = isObject && 'entry' in pluginConfig ? arrayify(pluginConfig.entry) : null;
                const project = isObject && 'project' in pluginConfig ? arrayify(pluginConfig.project) : entry;
                workspaces[workspaceName][pluginName as PluginName] = {
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

  private async getManifestWorkspaces(): Promise<string[]> {
    if (this.manifestWorkspaces) return this.manifestWorkspaces;
    if (this.manifest) {
      const workspaces = await mapWorkspaces({
        pkg: this.manifest,
        cwd: this.cwd,
        ignore: this.config.ignoreWorkspaces,
        absolute: false,
      });
      this.manifestWorkspaces = Array.from(workspaces.values())
        .map(dir => path.relative(this.cwd, dir))
        .map(ensurePosixPath);
      return this.manifestWorkspaces;
    }
    return [];
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
    return activeWorkspaces.sort(byPathDepth).map(name => ({
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

  async getDescendentWorkspaces(name: string) {
    const manifestWorkspaces = await this.getManifestWorkspaces();
    const additionalWorkspaces = this.getAdditionalWorkspaces(manifestWorkspaces);
    return [...manifestWorkspaces, ...additionalWorkspaces]
      .filter(workspaceName => workspaceName !== name)
      .filter(workspaceName => name === ROOT_WORKSPACE_NAME || workspaceName.startsWith(name));
  }

  async getNegatedWorkspacePatterns(name: string) {
    const descendentWorkspaces = await this.getDescendentWorkspaces(name);
    const matchName = new RegExp(`^${name}/`);
    return descendentWorkspaces
      .map(workspaceName => workspaceName.replace(matchName, ''))
      .map(workspaceName => `!${workspaceName}`);
  }

  private getConfigKeyForWorkspace(workspaceName: string) {
    const configuredWorkspaces = this.getConfiguredWorkspaces();
    return configuredWorkspaces
      .sort(byPathDepth)
      .reverse()
      .find(pattern => micromatch.isMatch(workspaceName, pattern));
  }

  private hasConfigForWorkspace(workspaceName: string) {
    return Boolean(this.getConfigKeyForWorkspace(workspaceName));
  }

  getConfigForWorkspace(workspaceName: string) {
    const key = this.getConfigKeyForWorkspace(workspaceName);
    if (key && this.config?.workspaces?.[key]) return this.config.workspaces[key];
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
