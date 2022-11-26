import path from 'node:path';
import { ROOT_WORKSPACE_NAME, TEST_FILE_PATTERNS } from './constants.js';
import * as npm from './npm-scripts/index.js';
import * as plugins from './plugins/index.js';
import { debugLogFiles, debugLogIssues } from './util/debug.js';
import { _pureGlob, negate, removeProductionSuffix, hasProductionSuffix, hasNoProductionSuffix } from './util/glob.js';
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
  ancestorManifests: PackageJson[];
  rootWorkspaceConfig: WorkspaceConfiguration;
  rootConfig: Configuration;
  negatedWorkspacePatterns: string[];
  rootManifest: PackageJson;
  rootWorkspaceDir: string;
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
  ancestorManifests: PackageJson[];
  rootWorkspaceConfig: WorkspaceConfiguration;
  rootConfig: Configuration;
  referencedDependencyIssues: ReferencedDependencyIssues = new Set();
  manifest: PackageJson;
  rootWorkspaceDir: string;

  referencedDependencies: ReferencedDependencies = new Set();
  peerDependencies: Map<string, Set<string>> = new Map();

  negatedWorkspacePatterns: string[] = [];
  enabled: Record<PluginName, boolean>;
  isRoot;

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
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.config = config;
    this.ancestorManifests = ancestorManifests;

    this.isRoot = name === ROOT_WORKSPACE_NAME;

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
    return (
      this.config[pluginName] ??
      this.rootWorkspaceConfig[pluginName] ?? { config: [], entryFiles: [], projectFiles: [] }
    );
  }

  async init() {
    this.setEnabledPlugins();
    await this.initReferencedDependencies();
  }

  setEnabledPlugins() {
    const dependencies = new Set(
      [this.manifest, ...this.ancestorManifests]
        .flatMap(manifest => [Object.keys(manifest.dependencies ?? {}), Object.keys(manifest.devDependencies ?? {})])
        .flat()
    );

    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      const hasIsEnabled = typeof plugin.isEnabled === 'function';
      this.enabled[pluginName] = hasIsEnabled && plugin.isEnabled({ manifest: this.manifest, dependencies });
    }
  }

  async initReferencedDependencies() {
    const { dependencies, peerDependencies } = await npm.findDependencies(
      this.rootConfig.ignoreBinaries,
      this.manifest,
      this.isRoot,
      this.dir,
      this.rootWorkspaceDir
    );

    const filePath = path.join(this.dir, 'package.json');
    dependencies.forEach(dependency =>
      this.referencedDependencyIssues.add({ type: 'unlisted', filePath, symbol: dependency })
    );
    dependencies.forEach(dependency => this.referencedDependencies.add(dependency));

    this.peerDependencies = peerDependencies;
  }

  getEntryFilePatterns() {
    const { entryFiles } = this.config;
    if (entryFiles.length === 0) return [];
    return [entryFiles, TEST_FILE_PATTERNS, this.isRoot ? this.negatedWorkspacePatterns : []]
      .flat()
      .map(removeProductionSuffix);
  }

  getProjectFilePatterns() {
    const { projectFiles } = this.config;
    if (projectFiles.length === 0) return [];
    return [projectFiles, TEST_FILE_PATTERNS, this.isRoot ? this.negatedWorkspacePatterns : []]
      .flat()
      .map(removeProductionSuffix);
  }

  getPluginEntryFilePatterns(isProduction = false) {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const { entryFiles } = this.getConfigForPlugin(pluginName);
        const defaultEntryFiles = 'ENTRY_FILE_PATTERNS' in plugin ? plugin.ENTRY_FILE_PATTERNS : [];
        patterns.push(...(entryFiles.length > 0 ? entryFiles : defaultEntryFiles));
        if (!isProduction) {
          const entryFiles = 'PRODUCTION_ENTRY_FILE_PATTERNS' in plugin ? plugin.PRODUCTION_ENTRY_FILE_PATTERNS : [];
          patterns.push(...entryFiles);
        }
      }
    }
    return patterns.flat().map(removeProductionSuffix);
  }

  getPluginProjectFilePatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const { entryFiles, projectFiles } = this.getConfigForPlugin(pluginName);
        const defaultEntryFiles = 'ENTRY_FILE_PATTERNS' in plugin ? plugin.ENTRY_FILE_PATTERNS : [];
        const defaultProjectFiles =
          'PROJECT_FILE_PATTERNS' in plugin ? plugin.PROJECT_FILE_PATTERNS : defaultEntryFiles;
        patterns.push(
          ...(projectFiles.length > 0
            ? projectFiles
            : defaultProjectFiles.length > 0
            ? defaultProjectFiles
            : entryFiles.length > 0
            ? entryFiles
            : defaultEntryFiles)
        );
      }
    }
    return patterns.map(removeProductionSuffix);
  }

  getPluginConfigPatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const { config } = this.getConfigForPlugin(pluginName);
        const defaultConfigFiles = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
        patterns.push(...(config.length > 0 ? config : defaultConfigFiles));
      }
    }
    return patterns.map(removeProductionSuffix);
  }

  getProductionEntryFilePatterns() {
    const entryFiles = this.config.entryFiles.filter(hasProductionSuffix);
    if (entryFiles.length === 0) return [];
    const negatedEntryFiles = this.config.entryFiles.filter(hasNoProductionSuffix).map(negate);
    return [entryFiles, negatedEntryFiles, negatedTestFilePatterns, this.isRoot ? this.negatedWorkspacePatterns : []]
      .flat()
      .map(removeProductionSuffix);
  }

  getProductionProjectFilePatterns() {
    const projectFiles = this.config.projectFiles;
    if (projectFiles.length === 0) return this.getProductionEntryFilePatterns();
    const _projectFiles = this.config.projectFiles.map(pattern => {
      if (!pattern.endsWith('!') && !pattern.startsWith('!')) return negate(pattern);
      return pattern;
    });
    const negatedEntryFiles = this.config.entryFiles.filter(hasNoProductionSuffix).map(negate);
    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginEntryFilePatterns = this.getPluginEntryFilePatterns(true).map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      _projectFiles,
      negatedEntryFiles,
      negatedPluginConfigPatterns,
      negatedPluginEntryFilePatterns,
      negatedPluginProjectFilePatterns,
      negatedTestFilePatterns,
      this.isRoot ? this.negatedWorkspacePatterns : [],
    ]
      .flat()
      .map(removeProductionSuffix);
  }

  getProductionPluginEntryFilePatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        if ('PRODUCTION_ENTRY_FILE_PATTERNS' in plugin) {
          const { entryFiles } = this.getConfigForPlugin(pluginName);
          const defaultEntryFiles = plugin.PRODUCTION_ENTRY_FILE_PATTERNS;
          patterns.push(...(entryFiles.length > 0 ? entryFiles : defaultEntryFiles));
        }
      }
    }
    if (patterns.length === 0) return [];
    return [patterns.flat().map(removeProductionSuffix), negatedTestFilePatterns].flat();
  }

  getConfigurationEntryFilePattern(pluginName: PluginName) {
    const { config } = this.getConfigForPlugin(pluginName);
    const plugin = plugins[pluginName];
    const defaultConfig = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
    return config.length > 0 ? config : defaultConfig;
  }

  getWorkspaceIgnorePatterns() {
    const ignoreFiles = this.rootConfig.ignoreFiles;
    const ignore = this.config.ignore;
    return [...ignoreFiles, ...ignore];
  }

  public async findDependenciesByPlugins() {
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const hasDependencyFinder = 'findDependencies' in plugin && typeof plugin.findDependencies === 'function';
        if (hasDependencyFinder) {
          const dependencies = await this.findDependenciesByPlugin(pluginName, plugin.findDependencies);
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

  private async findDependenciesByPlugin(pluginName: PluginName, pluginCallback: GenericPluginCallback) {
    const patterns = this.getConfigurationEntryFilePattern(pluginName);
    const cwd = this.dir;
    const ignore = this.getWorkspaceIgnorePatterns();
    const configFilePaths = await _pureGlob({ patterns, cwd, ignore });
    const pluginConfig = this.getConfigForPlugin(pluginName);

    debugLogFiles(1, `Globbed ${pluginName} config file paths`, configFilePaths);

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

    debugLogIssues(1, `Dependencies used by ${pluginName} configuration`, referencedDependencyIssues);

    return referencedDependencyIssues;
  }
}
