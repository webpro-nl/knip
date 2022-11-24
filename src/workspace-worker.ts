import path from 'node:path';
import * as npm from './npm-scripts/index.js';
import * as plugins from './plugins/index.js';
import { ROOT_WORKSPACE_NAME, TEST_FILE_PATTERNS } from './util/constants.js';
import { debugLogFiles, debugLogIssues } from './util/debug.js';
import { _pureGlob, negate } from './util/glob.js';
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
  enabled;
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

    this.enabled = {
      babel: false,
      capacitor: false,
      changesets: false,
      cypress: false,
      eslint: false,
      gatsby: false,
      jest: false,
      next: false,
      nx: false,
      playwright: false,
      postcss: false,
      remark: false,
      remix: false,
      rollup: false,
      storybook: false,
    };
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

  // 1) Default mode, get entry file paths for source code (workspace.config.entryFiles), including test files
  getEntryFilePatterns() {
    const { entryFiles } = this.config;
    if (entryFiles.length === 0) return [];
    return [entryFiles, TEST_FILE_PATTERNS, this.isRoot ? this.negatedWorkspacePatterns : []]
      .flat()
      .map(p => p.replace(/!$/, ''));
  }

  // 2) Default mode, get project file paths for source code (workspace.config.projectFiles), including test files
  getProjectFilePatterns() {
    const { projectFiles } = this.config;
    if (projectFiles.length === 0) return [];
    return [projectFiles, TEST_FILE_PATTERNS, this.isRoot ? this.negatedWorkspacePatterns : []]
      .flat()
      .map(p => p.replace(/!$/, ''));
  }

  // 3) Default mode, get plugin ENTRY_FILE_PATTERNS (plugin.config.entryFiles)
  // Also add PRODUCTION_ENTRY_FILE_PATTERNS in default mode
  getPluginEntryFilePatterns(isProduction = false) {
    const patterns = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const pluginConfig = this.getConfigForPlugin(pluginName);
        const defaultConfigPatterns = 'ENTRY_FILE_PATTERNS' in plugin ? plugin.ENTRY_FILE_PATTERNS : [];
        patterns.push(...defaultConfigPatterns);
        patterns.push(...pluginConfig.entryFiles);
        if (!isProduction) {
          const defaultConfigPatterns =
            'PRODUCTION_ENTRY_FILE_PATTERNS' in plugin ? plugin.PRODUCTION_ENTRY_FILE_PATTERNS : [];
          patterns.push(...defaultConfigPatterns);
        }
      }
    }
    return patterns.flat().map(p => p.replace(/!$/, ''));
  }

  // 4) Default mode, get plugin.config.projectFiles, fallback to plugin.config.entryFiles, plugin ENTRY_FILE_PATTERNS
  getPluginProjectFilePatterns() {
    const patterns = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const pluginConfig = this.getConfigForPlugin(pluginName);
        const entryFilesPatterns = pluginConfig.entryFiles;
        const projectFilePatterns = pluginConfig.projectFiles;
        const defaultEntryFilePatterns = 'ENTRY_FILE_PATTERNS' in plugin ? plugin.ENTRY_FILE_PATTERNS : [];
        const defaultProjectFilePatterns =
          'PROJECT_FILE_PATTERNS' in plugin ? plugin.PROJECT_FILE_PATTERNS : defaultEntryFilePatterns;
        patterns.push(defaultProjectFilePatterns);
        patterns.push(projectFilePatterns.length > 0 ? projectFilePatterns : entryFilesPatterns);
      }
    }
    return patterns.flat().map(p => p.replace(/!$/, ''));
  }

  // 5) Default mode, get plugin.config.config fallback to CONFIG_FILE_PATTERNS
  getPluginConfigPatterns() {
    const patterns = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        const pluginConfig = this.getConfigForPlugin(pluginName);
        const defaultConfigPatterns = 'CONFIG_FILE_PATTERNS' in plugin ? plugin.CONFIG_FILE_PATTERNS : [];
        patterns.push(...defaultConfigPatterns);
        patterns.push(...pluginConfig.config);
      }
    }
    return patterns.flat().map(p => p.replace(/!$/, ''));
  }

  // 1) Production mode, get entry file paths for source code (workspace.config.entryFiles!), excluding test files
  getProductionEntryFilePatterns() {
    const entryFiles = this.config.entryFiles.filter(p => p.endsWith('!'));
    if (entryFiles.length === 0) return [];
    const negatedEntryFiles = this.config.entryFiles.filter(p => !p.endsWith('!')).map(negate);
    return [entryFiles, negatedEntryFiles, negatedTestFilePatterns, this.isRoot ? this.negatedWorkspacePatterns : []]
      .flat()
      .map(p => p.replace(/!$/, ''));
  }

  // 2) Production mode, get project file paths for source code (workspace.config.projectFiles!), excluding test files
  getProductionProjectFilePatterns() {
    // const projectFiles = this.config.projectFiles.filter(p => p.startsWith('!') || p.endsWith('!'));
    const projectFiles = this.config.projectFiles;
    if (projectFiles.length === 0) return this.getProductionEntryFilePatterns();
    const _projectFiles = this.config.projectFiles.map(p => {
      if (!p.endsWith('!') && !p.startsWith('!')) return negate(p);
      return p;
    });
    const negatedEntryFiles = this.config.entryFiles.filter(p => !p.endsWith('!')).map(negate);
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
      .map(p => p.replace(/!$/, ''));
  }

  // 3) Production mode, get plugin production entry file paths
  getProductionPluginEntryFilePatterns() {
    const patterns = [];
    for (const [pluginName, plugin] of Object.entries(plugins) as PluginNames) {
      if (this.enabled[pluginName]) {
        if ('PRODUCTION_ENTRY_FILE_PATTERNS' in plugin) {
          const pluginConfig = this.getConfigForPlugin(pluginName);
          const defaultConfigPatterns = plugin.PRODUCTION_ENTRY_FILE_PATTERNS;
          patterns.push(...defaultConfigPatterns);
          patterns.push(...pluginConfig.entryFiles);
        }
      }
    }
    const p = patterns.flat().map(p => p.replace(/!$/, ''));
    if (p.length === 0) return [];
    return [p, negatedTestFilePatterns].flat();
  }

  getConfigurationEntryFilePattern(pluginName: PluginName) {
    const pluginConfig = this.getConfigForPlugin(pluginName);
    return [...plugins[pluginName].CONFIG_FILE_PATTERNS, ...pluginConfig.config];
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

    debugLogFiles(1, `Globbed ${pluginName} config file paths`, configFilePaths);

    if (configFilePaths.length === 0) return [];

    const referencedDependencyIssues = (
      await Promise.all(
        configFilePaths.map(async configFilePath => {
          const dependencies = await pluginCallback(configFilePath, { cwd, manifest: this.manifest });
          return dependencies.map(symbol => ({ type: 'unlisted', filePath: configFilePath, symbol } as Issue));
        })
      )
    ).flat();

    debugLogIssues(1, `Dependencies used by ${pluginName} configuration`, referencedDependencyIssues);

    return referencedDependencyIssues;
  }
}
