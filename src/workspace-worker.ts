import path from 'node:path';
import { ROOT_WORKSPACE_NAME, TEST_FILE_PATTERNS } from './constants.js';
import * as npm from './manifest/index.js';
import * as plugins from './plugins/index.js';
import { InstalledBinaries, PeerDependencies } from './types/workspace.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _pureGlob, negate, hasProductionSuffix, hasNoProductionSuffix, prependDirToPattern } from './util/glob.js';
import type { Configuration, PluginConfiguration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { Entries, PackageJson } from 'type-fest';

type PluginNames = Entries<typeof plugins>;

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  rootWorkspaceConfig: WorkspaceConfiguration;
  rootConfig: Configuration;
  negatedWorkspacePatterns: string[];
  rootWorkspaceDir: string;
  isProduction: boolean;
};

type ReferencedDependencies = Set<[string, string]>;

const negatedTestFilePatterns = TEST_FILE_PATTERNS.map(negate);

/**
 * - Determines enabled plugins
 * - Finds referenced dependencies in npm scripts
 * - Collects peer dependencies
 * - Hands out workspace and plugin glob patterns
 * - Calls enabled plugins to find referenced dependencies and entry files
 */
export class WorkspaceWorker {
  name: string;
  dir: string;
  config: WorkspaceConfiguration;
  rootWorkspaceConfig: WorkspaceConfiguration;
  rootConfig: Configuration;
  manifest: PackageJson;
  rootWorkspaceDir: string;

  referencedDependencies: ReferencedDependencies = new Set();
  peerDependencies: PeerDependencies = new Map();
  installedBinaries: InstalledBinaries = new Map();
  entryFiles: Set<string> = new Set();

  negatedWorkspacePatterns: string[] = [];
  enabled: Record<PluginName, boolean>;
  enabledPlugins: PluginName[] = [];
  isRoot;
  isProduction;

  constructor({
    name,
    dir,
    config,
    rootWorkspaceConfig,
    rootConfig,
    negatedWorkspacePatterns,
    manifest,
    rootWorkspaceDir,
    isProduction,
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.config = config;

    this.isRoot = name === ROOT_WORKSPACE_NAME;
    this.isProduction = isProduction;

    this.rootConfig = rootConfig;
    this.rootWorkspaceConfig = rootWorkspaceConfig;
    this.rootWorkspaceDir = rootWorkspaceDir;
    this.negatedWorkspacePatterns = negatedWorkspacePatterns;
    this.manifest = manifest;

    this.enabled = Object.keys(plugins).reduce(
      (enabled, pluginName) => ({ ...enabled, [pluginName]: false }),
      {} as Record<PluginName, boolean>
    );
  }

  private getConfigForPlugin(pluginName: PluginName): PluginConfiguration {
    return this.config[pluginName] ?? { config: null, entry: null, project: null };
  }

  async setEnabledPlugins(enabledPluginsInAncestors: string[]) {
    const { manifest } = this;
    const dependencies = new Set(
      [Object.keys(manifest?.dependencies ?? {}), Object.keys(manifest?.devDependencies ?? {})].flat()
    );

    const pluginEntries = Object.entries(plugins) as PluginNames;

    for (const [pluginName, plugin] of pluginEntries) {
      const isEnabled = this.config[pluginName] !== false;
      const isEnabledInAncestor = enabledPluginsInAncestors.includes(pluginName);
      this.enabled[pluginName] =
        isEnabled && (isEnabledInAncestor || (await plugin.isEnabled({ cwd: this.dir, manifest, dependencies })));
    }

    this.enabledPlugins = pluginEntries.filter(([name]) => this.enabled[name]).map(([name]) => name);

    const enabledPluginNames = this.enabledPlugins.map(name => plugins[name].NAME);

    debugLogObject(`Enabled plugins (${this.name})`, enabledPluginNames);
  }

  async initReferencedDependencies() {
    const { dependencies, peerDependencies, installedBinaries, entryFiles } = await npm.findDependencies({
      config: this.config,
      manifest: this.manifest,
      isRoot: this.isRoot,
      isProduction: this.isProduction,
      dir: this.dir,
      cwd: this.rootWorkspaceDir,
    });

    const filePath = path.join(this.dir, 'package.json');
    dependencies.forEach(dependency => this.referencedDependencies.add([filePath, dependency]));
    entryFiles.forEach(entryFile => this.entryFiles.add(entryFile));
    this.peerDependencies = peerDependencies;
    this.installedBinaries = installedBinaries;
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

  public getWorkspaceIgnorePatterns() {
    return [...this.rootConfig.ignore, ...this.config.ignore.map(pattern => prependDirToPattern(this.name, pattern))];
  }

  public async findDependenciesByPlugins() {
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const isIncludePlugin = this.isProduction ? `PRODUCTION_ENTRY_FILE_PATTERNS` in plugin : true;
      if (this.enabled[pluginName] && isIncludePlugin) {
        const hasDependencyFinder = 'findDependencies' in plugin && typeof plugin.findDependencies === 'function';
        if (hasDependencyFinder) {
          const pluginConfig = this.getConfigForPlugin(pluginName);

          if (!pluginConfig) continue;

          const patterns = this.getConfigurationEntryFilePattern(pluginName);
          const cwd = this.dir;
          const ignore = this.getWorkspaceIgnorePatterns();
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
          if (pluginEntryFiles.size > 0) debugLogArray(`Entry files referenced in ${plugin.NAME}`, pluginEntryFiles);
        }
      }
    }
  }

  public getFinalDependencies() {
    return {
      peerDependencies: this.peerDependencies,
      installedBinaries: this.installedBinaries,
      referencedDependencies: this.referencedDependencies,
      entryFiles: this.entryFiles,
      enabledPlugins: this.enabledPlugins,
    };
  }
}
