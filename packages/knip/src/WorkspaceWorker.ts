import type { Entries } from 'type-fest';
import { CacheConsultant } from './CacheConsultant.js';
import { plugins } from './plugins.js';
import type { Configuration, EnsuredPluginConfiguration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { PackageJson } from './types/package-json.js';
import type { DependencySet } from './types/workspace.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _pureGlob, hasNoProductionSuffix, hasProductionSuffix, negate, prependDirToPattern } from './util/glob.js';
import { get, getKeysByValue } from './util/object.js';
import { basename, dirname, join, toPosix } from './util/path.js';
import { getFinalEntryPaths, loadConfigForPlugin } from './util/plugin.js';
import {
  fromEntryPattern,
  fromProductionEntryPattern,
  isEntryPattern,
  isProductionEntryPattern,
} from './util/protocols.js';

type PluginEntries = Entries<typeof plugins>;

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
    // biome-ignore lint/performance/noAccumulatingSpread: TODO
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

  cache: CacheConsultant<unknown>;

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

    this.cache = new CacheConsultant(`plugins-${name}`);
  }

  public async init() {
    this.enabledPlugins = await this.determineEnabledPlugins();
  }

  private async determineEnabledPlugins() {
    const manifest = this.manifest;
    const pluginEntries = Object.entries(plugins) as PluginEntries;

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

    const enabledPluginTitles = enabledPlugins.map(name => plugins[name].title);
    debugLogObject(this.name, 'Enabled plugins', enabledPluginTitles);

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
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginEntries) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabledPluginsMap[pluginName]) {
        const { entry, project } = pluginConfig;
        patterns.push(...(project ?? entry ?? plugin.project ?? []));
      }
    }
    return [patterns, this.negatedWorkspacePatterns].flat();
  }

  getPluginConfigPatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginEntries) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabledPluginsMap[pluginName] && pluginConfig) {
        const { config } = pluginConfig;
        patterns.push(...(config ?? plugin.config ?? []));
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
      if (!(pattern.endsWith('!') || pattern.startsWith('!'))) return negate(pattern);
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
      return pluginConfig.config ?? plugin.config ?? [];
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

    const baseOptions = {
      rootCwd: this.cwd,
      cwd,
      manifest: this.manifest,
      manifestScriptNames: this.manifestScriptNames,
      dependencies: this.dependencies,
      isProduction: this.isProduction,
      enabledPlugins: this.enabledPlugins,
    };

    for (const [pluginName, plugin] of Object.entries(plugins) as PluginEntries) {
      if (this.enabledPluginsMap[pluginName]) {
        const hasResolveEntryPaths = typeof plugin.resolveEntryPaths === 'function';
        const hasResolveConfig = typeof plugin.resolveConfig === 'function';
        const shouldRunConfigResolver =
          hasResolveConfig && (!this.isProduction || (this.isProduction && 'production' in plugin));
        const hasResolve = typeof plugin.resolve === 'function';
        const pluginConfig = this.getConfigForPlugin(pluginName);

        if (!pluginConfig) continue;

        const patterns = this.getConfigurationFilePatterns(pluginName);
        const allConfigFilePaths = await _pureGlob({ patterns, cwd, gitignore: false });

        const { packageJsonPath } = plugin;
        const configFilePaths = allConfigFilePaths.filter(
          filePath =>
            basename(filePath) !== 'package.json' ||
            (typeof packageJsonPath === 'function'
              ? packageJsonPath(this.manifest)
              : get(this.manifest, packageJsonPath ?? pluginName))
        );

        debugLogArray([name, plugin.title], 'config file paths', configFilePaths);

        const pluginDependencies = new Set<string>();

        const addDependency = (specifier: string, configFilePath?: string) => {
          pluginDependencies.add(specifier);
          if (isEntryPattern(specifier)) {
            entryFilePatterns.add(fromEntryPattern(specifier));
          } else if (isProductionEntryPattern(specifier)) {
            productionEntryFilePatterns.add(fromProductionEntryPattern(specifier));
          } else if (configFilePath) {
            referencedDependencies.add([configFilePath, toPosix(specifier)]);
          }
        };

        const options = { ...baseOptions, config: pluginConfig, configFileDir: cwd, configFileName: '' };

        const configEntryPaths: string[] = [];

        for (const configFilePath of configFilePaths) {
          const opts = { ...options, configFileDir: dirname(configFilePath), configFileName: basename(configFilePath) };
          if (hasResolveEntryPaths || shouldRunConfigResolver) {
            const fd = this.cache.getFileDescriptor(configFilePath);
            const config =
              !fd.changed && fd.meta?.data
                ? fd.meta.data
                : await loadConfigForPlugin(configFilePath, plugin, opts, pluginName);
            if (config) {
              if (hasResolveEntryPaths) {
                const dependencies = (await plugin.resolveEntryPaths?.(config, opts)) ?? [];
                for (const id of dependencies) configEntryPaths.push(id);
              }
              if (shouldRunConfigResolver) {
                const dependencies = (await plugin.resolveConfig?.(config, opts)) ?? [];
                for (const id of dependencies) addDependency(id, configFilePath);
              }

              if (fd.changed && fd.meta) fd.meta.data = config;
            }
          }
        }

        const finalEntryPaths = getFinalEntryPaths(plugin, options, configEntryPaths);
        for (const id of finalEntryPaths) addDependency(id);

        if (hasResolve) {
          const dependencies = (await plugin.resolve?.(options)) ?? [];
          for (const id of dependencies) addDependency(id, join(cwd, 'package.json'));
        }

        debugLogArray([name, plugin.title], 'dependencies', pluginDependencies);
      }
    }

    return {
      entryFilePatterns,
      productionEntryFilePatterns,
      referencedDependencies,
      enabledPlugins: this.enabledPlugins,
    };
  }

  public onDispose() {
    this.cache.reconcile();
  }
}
