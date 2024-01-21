import * as plugins from './plugins/index.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _pureGlob, negate, hasProductionSuffix, hasNoProductionSuffix, prependDirToPattern } from './util/glob.js';
import { FAKE_PATH } from './util/loader.js';
import { get, getKeysByValue } from './util/object.js';
import { basename, toPosix } from './util/path.js';
import {
  fromEntryPattern,
  fromProductionEntryPattern,
  isEntryPattern,
  isProductionEntryPattern,
} from './util/protocols.js';
import type { Configuration, EnsuredPluginConfiguration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { PackageJson } from './types/package-json.js';
import type { DependencySet } from './types/workspace.js';
import type { Entries } from 'type-fest';

type PluginNames = Entries<typeof plugins>;

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  dependencies: DependencySet;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[];
  enabledPluginsInAncestors: string[];
  isProduction: boolean;
  isStrict: boolean;
};

export type ReferencedDependencies = Set<[string, string]>;

const nullConfig: EnsuredPluginConfiguration = { config: null, entry: null, project: null };

const initEnabledPluginsMap = () =>
  Object.keys(plugins).reduce(
    (enabled, pluginName) => ({ ...enabled, [pluginName]: false }),
    {} as Record<PluginName, boolean>
  );

/**
 * - Determines enabled plugins
 * - Hands out workspace and plugin glob patterns
 * - Calls enabled plugins to find referenced dependencies
 */
export class WorkspaceWorker {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  manifestScriptNames: Set<string>;
  dependencies: DependencySet;
  isProduction;
  isStrict;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[] = [];

  enabledPluginsMap = initEnabledPluginsMap();
  enabledPlugins: PluginName[] = [];
  enabledPluginsInAncestors: string[];

  constructor({
    name,
    dir,
    cwd,
    config,
    manifest,
    dependencies,
    isProduction,
    isStrict,
    rootIgnore,
    negatedWorkspacePatterns,
    enabledPluginsInAncestors,
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.cwd = cwd;
    this.config = config;
    this.manifest = manifest;
    this.manifestScriptNames = new Set(Object.keys(manifest.scripts ?? {}));
    this.dependencies = dependencies;
    this.isProduction = isProduction;
    this.isStrict = isStrict;
    this.rootIgnore = rootIgnore;
    this.negatedWorkspacePatterns = negatedWorkspacePatterns;
    this.enabledPluginsInAncestors = enabledPluginsInAncestors;
  }

  public async init() {
    this.enabledPlugins = await this.determineEnabledPlugins();
  }

  private async determineEnabledPlugins() {
    const manifest = this.manifest;
    const pluginEntries = Object.entries(plugins) as PluginNames;

    for (const [pluginName, plugin] of pluginEntries) {
      if (this.config[pluginName] === false) continue;
      if (this.config[pluginName]) {
        this.enabledPluginsMap[pluginName] = true;
        continue;
      }
      const isEnabledInAncestor = this.enabledPluginsInAncestors.includes(pluginName);
      if (
        isEnabledInAncestor ||
        (await plugin.isEnabled({ cwd: this.dir, manifest, dependencies: this.dependencies, config: this.config }))
      ) {
        this.enabledPluginsMap[pluginName] = true;
      }
    }

    const enabledPlugins = getKeysByValue(this.enabledPluginsMap, true);

    const enabledPluginNames = enabledPlugins.map(name => plugins[name].NAME);
    debugLogObject(this.name, 'Enabled plugins', enabledPluginNames);

    return enabledPlugins;
  }

  private getConfigForPlugin(pluginName: PluginName): EnsuredPluginConfiguration {
    const config = this.config[pluginName];
    return typeof config === 'undefined' || typeof config === 'boolean' ? nullConfig : config;
  }

  getEntryFilePatterns() {
    const { entry } = this.config;
    if (entry.length === 0) return [];
    const excludeProductionNegations = entry.filter(pattern => !(pattern.startsWith('!') && pattern.endsWith('!')));
    return [excludeProductionNegations, this.negatedWorkspacePatterns].flat();
  }

  getProjectFilePatterns(testFilePatterns: string[]) {
    const { project } = this.config;
    if (project.length === 0) return [];

    const excludeProductionNegations = project.filter(pattern => !(pattern.startsWith('!') && pattern.endsWith('!')));
    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      excludeProductionNegations,
      negatedPluginConfigPatterns,
      negatedPluginProjectFilePatterns,
      testFilePatterns,
      this.negatedWorkspacePatterns,
    ].flat();
  }

  getPluginProjectFilePatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabledPluginsMap[pluginName]) {
        const { entry, project } = pluginConfig;
        patterns.push(...(project ?? entry ?? ('PROJECT_FILE_PATTERNS' in plugin ? plugin.PROJECT_FILE_PATTERNS : [])));
      }
    }
    return [patterns, this.negatedWorkspacePatterns].flat();
  }

  getPluginConfigPatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabledPluginsMap[pluginName] && pluginConfig) {
        const { config } = pluginConfig;
        const defaultConfigFiles = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
        patterns.push(...(config ?? defaultConfigFiles));
      }
    }
    return patterns;
  }

  getProductionEntryFilePatterns(negatedTestFilePatterns: string[]) {
    const entry = this.config.entry.filter(hasProductionSuffix);
    if (entry.length === 0) return [];
    const negatedEntryFiles = this.config.entry.filter(hasNoProductionSuffix).map(negate);
    return [entry, negatedEntryFiles, negatedTestFilePatterns, this.negatedWorkspacePatterns].flat();
  }

  getProductionProjectFilePatterns(negatedTestFilePatterns: string[]) {
    const project = this.config.project;
    if (project.length === 0) return this.getProductionEntryFilePatterns(negatedTestFilePatterns);
    const _project = this.config.project.map(pattern => {
      if (!pattern.endsWith('!') && !pattern.startsWith('!')) return negate(pattern);
      return pattern;
    });
    const negatedEntryFiles = this.config.entry.filter(hasNoProductionSuffix).map(negate);
    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      _project,
      negatedEntryFiles,
      negatedPluginConfigPatterns,
      negatedPluginProjectFilePatterns,
      negatedTestFilePatterns,
      this.negatedWorkspacePatterns,
    ].flat();
  }

  private getConfigurationFilePatterns(pluginName: PluginName) {
    const plugin = plugins[pluginName];
    const pluginConfig = this.getConfigForPlugin(pluginName);
    if (pluginConfig) {
      const defaultConfig = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
      return pluginConfig.config ?? defaultConfig;
    }
    return [];
  }

  public getIgnorePatterns() {
    return [...this.rootIgnore, ...this.config.ignore.map(pattern => prependDirToPattern(this.name, pattern))];
  }

  public async findDependenciesByPlugins() {
    const entryFilePatterns = new Set<string>();
    const productionEntryFilePatterns = new Set<string>();
    const referencedDependencies: ReferencedDependencies = new Set();

    const name = this.name;
    const cwd = this.dir;

    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabledPluginsMap[pluginName]) {
        const hasDependencyFinder = 'findDependencies' in plugin && typeof plugin.findDependencies === 'function';
        if (hasDependencyFinder) {
          const pluginConfig = this.getConfigForPlugin(pluginName);

          if (!pluginConfig) continue;

          const patterns = this.getConfigurationFilePatterns(pluginName);
          const allConfigFilePaths = await _pureGlob({ patterns, cwd, gitignore: false });

          const configFilePaths = allConfigFilePaths.filter(
            filePath =>
              basename(filePath) !== 'package.json' ||
              get(this.manifest, 'PACKAGE_JSON_PATH' in plugin ? plugin.PACKAGE_JSON_PATH : pluginName)
          );

          debugLogArray([name, plugin.NAME], 'config file paths', configFilePaths);

          // Plugin has no config files configured, add one to still invoke it and get the entry:/production: patterns
          if (configFilePaths.length === 0) configFilePaths.push(FAKE_PATH);

          const pluginDependencies = new Set<string>();

          for (const configFilePath of configFilePaths) {
            const dependencies = await plugin.findDependencies(configFilePath, {
              cwd,
              manifest: this.manifest,
              manifestScriptNames: this.manifestScriptNames,
              dependencies: this.dependencies,
              config: pluginConfig,
              isProduction: this.isProduction,
              enabledPlugins: this.enabledPlugins,
            });

            dependencies.forEach(specifier => {
              pluginDependencies.add(specifier);
              if (isEntryPattern(specifier)) {
                entryFilePatterns.add(fromEntryPattern(specifier));
              } else if (isProductionEntryPattern(specifier)) {
                productionEntryFilePatterns.add(fromProductionEntryPattern(specifier));
              } else {
                referencedDependencies.add([configFilePath, toPosix(specifier)]);
              }
            });
          }

          debugLogArray([name, plugin.NAME], 'dependencies', pluginDependencies);
        }
      }
    }

    return {
      entryFilePatterns,
      productionEntryFilePatterns,
      referencedDependencies,
      enabledPlugins: this.enabledPlugins,
    };
  }
}
