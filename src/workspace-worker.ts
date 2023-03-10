import { TEST_FILE_PATTERNS } from './constants.js';
import * as npm from './manifest/index.js';
import * as plugins from './plugins/index.js';
import { InstalledBinaries, PeerDependencies } from './types/workspace.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _pureGlob, negate, hasProductionSuffix, hasNoProductionSuffix, prependDirToPattern } from './util/glob.js';
import { join } from './util/path.js';
import type { Configuration, PluginConfiguration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { Entries, PackageJson } from 'type-fest';

type PluginNames = Entries<typeof plugins>;

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[];
  enabledPluginsInAncestors: string[];
  isProduction: boolean;
};

type ReferencedDependencies = Set<[string, string]>;

const negatedTestFilePatterns = TEST_FILE_PATTERNS.map(negate);

/**
 * - Determines enabled plugins
 * - Finds referenced dependencies, binaries and entry files in npm scripts
 * - Collects peer dependencies
 * - Hands out workspace and plugin glob patterns
 * - Calls enabled plugins to find referenced dependencies and entry files
 */
export class WorkspaceWorker {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  isProduction;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[] = [];
  enabledPluginsInAncestors: string[];

  enabled: Record<PluginName, boolean>;
  enabledPlugins: PluginName[] = [];
  referencedDependencies: ReferencedDependencies = new Set();
  peerDependencies: PeerDependencies = new Map();
  installedBinaries: InstalledBinaries = new Map();
  entryFiles: Set<string> = new Set();

  constructor({
    name,
    dir,
    cwd,
    config,
    manifest,
    isProduction,
    rootIgnore,
    negatedWorkspacePatterns,
    enabledPluginsInAncestors,
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.cwd = cwd;
    this.config = config;
    this.manifest = manifest;
    this.isProduction = isProduction;
    this.rootIgnore = rootIgnore;
    this.negatedWorkspacePatterns = negatedWorkspacePatterns;
    this.enabledPluginsInAncestors = enabledPluginsInAncestors;

    this.enabled = Object.keys(plugins).reduce(
      (enabled, pluginName) => ({ ...enabled, [pluginName]: false }),
      {} as Record<PluginName, boolean>
    );
  }

  public async init() {
    await this.setEnabledPlugins();
    await this.initReferencedDependencies();
  }

  private async setEnabledPlugins() {
    const manifest = this.manifest;
    const deps = Object.keys(manifest.dependencies ?? {});
    const devDeps = Object.keys(manifest.devDependencies ?? {});
    const dependencies = new Set([...deps, ...devDeps]);

    const pluginEntries = Object.entries(plugins) as PluginNames;

    for (const [pluginName, plugin] of pluginEntries) {
      if (this.config[pluginName] === false) continue;
      const isEnabledInAncestor = this.enabledPluginsInAncestors.includes(pluginName);
      if (isEnabledInAncestor || (await plugin.isEnabled({ cwd: this.dir, manifest, dependencies }))) {
        this.enabled[pluginName] = true;
      }
    }

    this.enabledPlugins = pluginEntries.filter(([name]) => this.enabled[name]).map(([name]) => name);

    const enabledPluginNames = this.enabledPlugins.map(name => plugins[name].NAME);

    debugLogObject(`Enabled plugins (${this.name})`, enabledPluginNames);
  }

  private async initReferencedDependencies() {
    const { dependencies, peerDependencies, installedBinaries, entryFiles } = await npm.findDependencies({
      config: this.config,
      manifest: this.manifest,
      isProduction: this.isProduction,
      dir: this.dir,
      cwd: this.cwd,
    });

    const filePath = join(this.dir, 'package.json');
    dependencies.forEach(dependency => this.referencedDependencies.add([filePath, dependency]));
    entryFiles.forEach(entryFile => this.entryFiles.add(entryFile));
    this.peerDependencies = peerDependencies;
    this.installedBinaries = installedBinaries;
  }

  private getConfigForPlugin(pluginName: PluginName): PluginConfiguration {
    return this.config[pluginName] ?? { config: null, entry: null, project: null };
  }

  getEntryFilePatterns() {
    const { entry } = this.config;
    if (entry.length === 0) return [];
    return [entry, TEST_FILE_PATTERNS, this.negatedWorkspacePatterns].flat();
  }

  getProjectFilePatterns() {
    const { project } = this.config;
    if (project.length === 0) return [];

    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginEntryFilePatterns = this.getPluginEntryFilePatterns(false).map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      project,
      negatedPluginConfigPatterns,
      negatedPluginEntryFilePatterns,
      negatedPluginProjectFilePatterns,
      TEST_FILE_PATTERNS,
      this.negatedWorkspacePatterns,
    ].flat();
  }

  getPluginEntryFilePatterns(isIncludeProductionEntryFiles = true) {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabled[pluginName] && pluginConfig) {
        const { entry } = pluginConfig;
        const defaultEntryFiles = 'ENTRY_FILE_PATTERNS' in plugin ? plugin.ENTRY_FILE_PATTERNS : [];
        patterns.push(...(entry ?? defaultEntryFiles));
        if (isIncludeProductionEntryFiles) {
          const entry = 'PRODUCTION_ENTRY_FILE_PATTERNS' in plugin ? plugin.PRODUCTION_ENTRY_FILE_PATTERNS : [];
          patterns.push(...entry);
        }
      }
    }
    return [patterns, this.negatedWorkspacePatterns].flat();
  }

  getPluginProjectFilePatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabled[pluginName] && pluginConfig) {
        const { entry, project } = pluginConfig;
        patterns.push(
          ...(project ??
            entry ??
            ('PROJECT_FILE_PATTERNS' in plugin
              ? plugin.PROJECT_FILE_PATTERNS
              : 'ENTRY_FILE_PATTERNS' in plugin
              ? plugin.ENTRY_FILE_PATTERNS
              : []))
        );
      }
    }
    return [patterns, this.negatedWorkspacePatterns].flat();
  }

  getPluginConfigPatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabled[pluginName] && pluginConfig) {
        const { config } = pluginConfig;
        const defaultConfigFiles = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
        patterns.push(...(config ?? defaultConfigFiles));
      }
    }
    return patterns;
  }

  getProductionEntryFilePatterns() {
    const entry = this.config.entry.filter(hasProductionSuffix);
    if (entry.length === 0) return [];
    const negatedEntryFiles = this.config.entry.filter(hasNoProductionSuffix).map(negate);
    return [entry, negatedEntryFiles, negatedTestFilePatterns, this.negatedWorkspacePatterns].flat();
  }

  getProductionProjectFilePatterns() {
    const project = this.config.project;
    if (project.length === 0) return this.getProductionEntryFilePatterns();
    const _project = this.config.project.map(pattern => {
      if (!pattern.endsWith('!') && !pattern.startsWith('!')) return negate(pattern);
      return pattern;
    });
    const negatedEntryFiles = this.config.entry.filter(hasNoProductionSuffix).map(negate);
    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginEntryFilePatterns = this.getPluginEntryFilePatterns(false).map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      _project,
      negatedEntryFiles,
      negatedPluginConfigPatterns,
      negatedPluginEntryFilePatterns,
      negatedPluginProjectFilePatterns,
      negatedTestFilePatterns,
      this.negatedWorkspacePatterns,
    ].flat();
  }

  getProductionPluginEntryFilePatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabled[pluginName] && pluginConfig) {
        if ('PRODUCTION_ENTRY_FILE_PATTERNS' in plugin) {
          patterns.push(...(pluginConfig.entry ?? plugin.PRODUCTION_ENTRY_FILE_PATTERNS));
        }
      }
    }
    if (patterns.length === 0) return [];
    return [patterns.flat(), negatedTestFilePatterns].flat();
  }

  private getConfigurationEntryFilePattern(pluginName: PluginName) {
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

  private async findDependenciesByPlugins() {
    const cwd = this.dir;
    const ignore = this.getIgnorePatterns();

    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const isIncludePlugin = this.isProduction ? `PRODUCTION_ENTRY_FILE_PATTERNS` in plugin : true;
      if (this.enabled[pluginName] && isIncludePlugin) {
        const hasDependencyFinder = 'findDependencies' in plugin && typeof plugin.findDependencies === 'function';
        if (hasDependencyFinder) {
          const pluginConfig = this.getConfigForPlugin(pluginName);

          if (!pluginConfig) continue;

          const patterns = this.getConfigurationEntryFilePattern(pluginName);
          const configFilePaths = await _pureGlob({ patterns, cwd, ignore });

          debugLogArray(`Found ${plugin.NAME} config file paths`, configFilePaths);

          if (configFilePaths.length === 0) continue;

          const pluginDependencies: Set<string> = new Set();
          const pluginEntryFiles: Set<string> = new Set();

          for (const configFilePath of configFilePaths) {
            const results = await plugin.findDependencies(configFilePath, {
              cwd,
              manifest: this.manifest,
              config: pluginConfig,
              workspaceConfig: this.config,
              isProduction: this.isProduction,
            });

            const dependencies = Array.isArray(results) ? results : results.dependencies;
            const entryFiles = !Array.isArray(results) && results.entryFiles ? results.entryFiles : [];

            dependencies.forEach(symbol => this.referencedDependencies.add([configFilePath, symbol]));
            entryFiles.forEach(entryFile => this.entryFiles.add(entryFile));

            dependencies.forEach(dependency => pluginDependencies.add(dependency));
            entryFiles.forEach(entryFile => pluginEntryFiles.add(entryFile));
          }

          debugLogArray(`Dependencies referenced in ${plugin.NAME}`, pluginDependencies);
          if (pluginEntryFiles.size > 0) {
            debugLogArray(`Entry files referenced in ${plugin.NAME}`, pluginEntryFiles);
          }
        }
      }
    }
  }

  public async findAllDependencies() {
    await this.findDependenciesByPlugins();

    return {
      peerDependencies: this.peerDependencies,
      installedBinaries: this.installedBinaries,
      referencedDependencies: this.referencedDependencies,
      entryFiles: this.entryFiles,
      enabledPlugins: this.enabledPlugins,
    };
  }
}
