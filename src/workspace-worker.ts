import path from 'node:path';
import { ROOT_WORKSPACE_NAME, TEST_FILE_PATTERNS } from './constants.js';
import * as npm from './manifest/index.js';
import * as plugins from './plugins/index.js';
import { InstalledBinaries, PeerDependencies } from './types/workspace.js';
import { debugLogFiles, debugLogIssues, debugLogObject } from './util/debug.js';
import { _pureGlob, negate, hasProductionSuffix, hasNoProductionSuffix } from './util/glob.js';
import type { Configuration, PluginConfiguration, PluginName, WorkspaceConfiguration } from './types/config.js';
import type { Issue } from './types/issues.js';
import type { GenericPluginCallback } from './types/plugins.js';
import type { Entries, PackageJson } from 'type-fest';

type PluginNames = Entries<typeof plugins>;

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  ancestorManifests: (PackageJson | undefined)[];
  rootWorkspaceConfig: WorkspaceConfiguration;
  rootConfig: Configuration;
  negatedWorkspacePatterns: string[];
  rootWorkspaceDir: string;
  isProduction: boolean;
};

type ReferencedDependencyIssues = Set<Issue>;

type ReferencedDependencies = Set<string>;

const negatedTestFilePatterns = TEST_FILE_PATTERNS.map(negate);

/**
 * - Determines enabled plugins
 * - Finds referenced dependencies in npm scripts
 * - Collects peer dependencies
 * - Hands out workspace and plugin glob patterns
 * - Calls enabled plugins to find referenced dependencies
 */
export default class WorkspaceWorker {
  name: string;
  dir: string;
  config: WorkspaceConfiguration;
  ancestorManifests: (PackageJson | undefined)[];
  rootWorkspaceConfig: WorkspaceConfiguration;
  rootConfig: Configuration;
  referencedDependencyIssues: ReferencedDependencyIssues = new Set();
  manifest: PackageJson;
  rootWorkspaceDir: string;

  referencedDependencies: ReferencedDependencies = new Set();
  peerDependencies: PeerDependencies = new Map();
  installedBinaries: InstalledBinaries = new Map();

  negatedWorkspacePatterns: string[] = [];
  enabled: Record<PluginName, boolean>;
  isRoot;
  isProduction;

  constructor({
    name,
    dir,
    config,
    ancestorManifests,
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
    this.ancestorManifests = ancestorManifests;

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

  getConfigForPlugin(pluginName: PluginName): PluginConfiguration {
    return this.config[pluginName] ?? { config: null, entry: null, project: null };
  }

  async init() {
    this.setEnabledPlugins();
    await this.initReferencedDependencies();
  }

  setEnabledPlugins() {
    // If a dependency is found its own or an ancestor workspace manifest, the plugin is enabled for this workspace too
    const dependencies = new Set(
      [this.manifest, ...this.ancestorManifests]
        .flatMap(manifest => [Object.keys(manifest?.dependencies ?? {}), Object.keys(manifest?.devDependencies ?? {})])
        .flat()
    );

    const pluginEntries = Object.entries(plugins) as PluginNames;

    for (const [pluginName, plugin] of pluginEntries) {
      const hasIsEnabled = typeof plugin.isEnabled === 'function';
      this.enabled[pluginName] =
        this.config[pluginName] !== false &&
        hasIsEnabled &&
        plugin.isEnabled({ manifest: this.manifest, dependencies });
    }

    const enabledPlugins = pluginEntries.filter(([name]) => this.enabled[name]).map(([, plugin]) => plugin.NAME);
    debugLogObject(`Enabled plugins (${this.name})`, enabledPlugins);
  }

  async initReferencedDependencies() {
    const { dependencies, peerDependencies, installedBinaries } = await npm.findDependencies({
      rootConfig: this.rootConfig,
      manifest: this.manifest,
      isRoot: this.isRoot,
      isProduction: this.isProduction,
      dir: this.dir,
      cwd: this.rootWorkspaceDir,
    });

    const filePath = path.join(this.dir, 'package.json');
    dependencies.forEach(dependency =>
      this.referencedDependencyIssues.add({ type: 'unlisted', filePath, symbol: dependency })
    );
    dependencies.forEach(dependency => this.referencedDependencies.add(dependency));

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

  getConfigurationEntryFilePattern(pluginName: PluginName) {
    const plugin = plugins[pluginName];
    const pluginConfig = this.getConfigForPlugin(pluginName);
    if (pluginConfig) {
      const defaultConfig = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
      return pluginConfig.config ?? defaultConfig;
    }
    return [];
  }

  getWorkspaceIgnorePatterns() {
    return [...this.rootConfig.ignore, ...this.config.ignore];
  }

  public async findDependenciesByPlugins() {
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const isIncludePlugin = this.isProduction ? `PRODUCTION_ENTRY_FILE_PATTERNS` in plugin : true;
      if (this.enabled[pluginName] && isIncludePlugin) {
        const hasDependencyFinder = 'findDependencies' in plugin && typeof plugin.findDependencies === 'function';
        if (hasDependencyFinder) {
          const dependencies = await this.findDependenciesByPlugin(pluginName, plugin.NAME, plugin.findDependencies);
          dependencies.forEach(dependency => this.referencedDependencyIssues.add(dependency));
          dependencies.forEach(dependency => this.referencedDependencies.add(dependency.symbol));
        }
      }
    }

    return {
      referencedDependencyIssues: this.referencedDependencyIssues,
      referencedDependencies: this.referencedDependencies,
    };
  }

  private async findDependenciesByPlugin(
    pluginName: PluginName,
    pluginTitle: string,
    pluginCallback: GenericPluginCallback
  ) {
    const pluginConfig = this.getConfigForPlugin(pluginName);

    if (!pluginConfig) return [];

    const patterns = this.getConfigurationEntryFilePattern(pluginName);
    const cwd = this.dir;
    const ignore = this.getWorkspaceIgnorePatterns();
    const configFilePaths = await _pureGlob({ patterns, cwd, ignore });

    debugLogFiles(`Globbed ${pluginTitle} config file paths`, configFilePaths);

    if (configFilePaths.length === 0) return [];

    const referencedDependencyIssues = (
      await Promise.all(
        configFilePaths.map(async configFilePath => {
          const dependencies = await pluginCallback(configFilePath, {
            cwd,
            manifest: this.manifest,
            config: pluginConfig,
            workspaceConfig: this.config,
          });
          return dependencies.map(symbol => ({ type: 'unlisted', filePath: configFilePath, symbol } as Issue));
        })
      )
    ).flat();

    debugLogIssues(`Dependencies used by ${pluginTitle} configuration`, referencedDependencyIssues);

    return referencedDependencyIssues;
  }
}
