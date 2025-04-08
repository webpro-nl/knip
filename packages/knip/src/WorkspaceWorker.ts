import { CacheConsultant } from './CacheConsultant.js';
import type { Workspace } from './ConfigurationChief.js';
import { _getInputsFromScripts } from './binaries/index.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import { getFilteredScripts } from './manifest/helpers.js';
import { PluginEntries, Plugins } from './plugins.js';
import type { PluginName } from './types/PluginNames.js';
import type {
  Configuration,
  EnsuredPluginConfiguration,
  GetInputsFromScriptsPartial,
  GetReferencedInternalFilePath,
  GetSourceFile,
  WorkspaceConfiguration,
} from './types/config.js';
import type { PackageJson } from './types/package-json.js';
import type { DependencySet } from './types/workspace.js';
import { compact } from './util/array.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _glob, hasNoProductionSuffix, hasProductionSuffix, negate, prependDirToPattern } from './util/glob.js';
import {
  type ConfigInput,
  type Input,
  isConfig,
  toConfig,
  toDebugString,
  toEntry,
  toProductionEntry,
} from './util/input.js';
import { getKeysByValue } from './util/object.js';
import { basename, dirname, join } from './util/path.js';
import { loadConfigForPlugin } from './util/plugin.js';

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  dependencies: DependencySet;
  getReferencedInternalFilePath: GetReferencedInternalFilePath;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  getSourceFile: GetSourceFile;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[];
  ignoredWorkspacePatterns: string[];
  enabledPluginsInAncestors: string[];
  isProduction: boolean;
  isStrict: boolean;
  isCache: boolean;
  cacheLocation: string;
  configFilesMap: Map<string, Map<PluginName, Set<string>>>;
};

type CacheItem = { resolveEntryPaths?: Input[]; resolveConfig?: Input[]; resolveFromAST?: Input[] };

const nullConfig: EnsuredPluginConfiguration = { config: null, entry: null, project: null };

const initEnabledPluginsMap = () =>
  Object.keys(Plugins).reduce(
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
  dependencies: DependencySet;
  getReferencedInternalFilePath: GetReferencedInternalFilePath;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  getSourceFile: GetSourceFile;
  isProduction;
  isStrict;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[] = [];
  ignoredWorkspacePatterns: string[] = [];

  enabledPluginsMap = initEnabledPluginsMap();
  enabledPlugins: PluginName[] = [];
  enabledPluginsInAncestors: string[];

  cache: CacheConsultant<CacheItem>;

  configFilesMap: Map<string, Map<PluginName, Set<string>>>;

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
    ignoredWorkspacePatterns,
    enabledPluginsInAncestors,
    getReferencedInternalFilePath,
    findWorkspaceByFilePath,
    getSourceFile,
    isCache,
    cacheLocation,
    configFilesMap,
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.cwd = cwd;
    this.config = config;
    this.manifest = manifest;
    this.dependencies = dependencies;
    this.isProduction = isProduction;
    this.isStrict = isStrict;
    this.rootIgnore = rootIgnore;
    this.negatedWorkspacePatterns = negatedWorkspacePatterns;
    this.ignoredWorkspacePatterns = ignoredWorkspacePatterns;
    this.enabledPluginsInAncestors = enabledPluginsInAncestors;
    this.configFilesMap = configFilesMap;

    this.getReferencedInternalFilePath = getReferencedInternalFilePath;
    this.findWorkspaceByFilePath = findWorkspaceByFilePath;
    this.getSourceFile = getSourceFile;

    this.cache = new CacheConsultant({ name: `plugins-${name}`, isEnabled: isCache, cacheLocation });
  }

  public async init() {
    this.enabledPlugins = await this.determineEnabledPlugins();
  }

  private async determineEnabledPlugins() {
    const manifest = this.manifest;

    for (const [pluginName, plugin] of PluginEntries) {
      if (this.config[pluginName] === false) continue;
      if (this.cwd !== this.dir && plugin.isRootOnly) continue;
      if (this.config[pluginName]) {
        this.enabledPluginsMap[pluginName] = true;
        continue;
      }
      const isEnabledInAncestor = this.enabledPluginsInAncestors.includes(pluginName);
      if (
        isEnabledInAncestor ||
        (typeof plugin.isEnabled === 'function' &&
          (await plugin.isEnabled({ cwd: this.dir, manifest, dependencies: this.dependencies, config: this.config })))
      ) {
        this.enabledPluginsMap[pluginName] = true;
      }
    }

    return getKeysByValue(this.enabledPluginsMap, true);
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

  getProjectFilePatterns(projectFilePatterns: string[]) {
    const { project } = this.config;
    if (project.length === 0) return [];

    const excludeProductionNegations = project.filter(pattern => !(pattern.startsWith('!') && pattern.endsWith('!')));
    const negatedPluginConfigPatterns = this.getPluginConfigPatterns().map(negate);
    const negatedPluginProjectFilePatterns = this.getPluginProjectFilePatterns().map(negate);

    return [
      excludeProductionNegations,
      negatedPluginConfigPatterns,
      negatedPluginProjectFilePatterns,
      projectFilePatterns,
      this.negatedWorkspacePatterns,
    ].flat();
  }

  getPluginProjectFilePatterns(patterns: string[] = []) {
    for (const [pluginName, plugin] of PluginEntries) {
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
    for (const [pluginName, plugin] of PluginEntries) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabledPluginsMap[pluginName] && pluginConfig) {
        const { config } = pluginConfig;
        patterns.push(...(config ?? plugin.config ?? []));
      }
    }
    return patterns;
  }

  getPluginEntryFilePatterns(patterns: string[]) {
    const negateWorkspaces = patterns.some(pattern => pattern.startsWith('**/')) ? this.negatedWorkspacePatterns : [];
    return [patterns, negateWorkspaces, this.ignoredWorkspacePatterns.map(negate)].flat();
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
    const plugin = Plugins[pluginName];
    const pluginConfig = this.getConfigForPlugin(pluginName);
    return pluginConfig.config ?? plugin.config ?? [];
  }

  public getIgnorePatterns() {
    return [...this.rootIgnore, ...this.config.ignore.map(pattern => prependDirToPattern(this.name, pattern))];
  }

  public async runPlugins() {
    const wsName = this.name;
    const cwd = this.dir;
    const rootCwd = this.cwd;
    const manifest = this.manifest;
    const containingFilePath = join(cwd, 'package.json');
    const isProduction = this.isProduction;
    const knownBinsOnly = false;

    const manifestScriptNames = new Set(Object.keys(manifest.scripts ?? {}));
    const baseOptions = { manifestScriptNames, cwd, rootCwd, containingFilePath, knownBinsOnly };

    // Get dependencies from package.json#scripts
    const baseScriptOptions = { ...baseOptions, manifest, isProduction, enabledPlugins: this.enabledPlugins };
    const [productionScripts, developmentScripts] = getFilteredScripts(manifest.scripts ?? {});
    const inputsFromManifest = _getInputsFromScripts(Object.values(developmentScripts), baseOptions);
    const productionInputsFromManifest = _getInputsFromScripts(Object.values(productionScripts), baseOptions);

    const hasProductionInput = (input: Input) =>
      productionInputsFromManifest.find(d => d.specifier === input.specifier && d.type === input.type);

    const createGetInputsFromScripts =
      (containingFilePath: string): GetInputsFromScriptsPartial =>
      (scripts, options) =>
        _getInputsFromScripts(scripts, { ...baseOptions, ...options, containingFilePath });

    const inputs: Input[] = [];
    const remainingPlugins = new Set(this.enabledPlugins);

    const addInput = (input: Input, containingFilePath = input.containingFilePath) => {
      if (isConfig(input)) {
        handleConfigInput(input.pluginName, { ...input, containingFilePath });
      } else {
        inputs.push({ ...input, containingFilePath });
      }
    };

    const configFilesMap = this.configFilesMap;
    const configFiles = this.configFilesMap.get(wsName);

    const handleConfigInput = (pluginName: PluginName, input: ConfigInput) => {
      const configFilePath = this.getReferencedInternalFilePath(input);
      if (configFilePath) {
        const workspace = this.findWorkspaceByFilePath(configFilePath);
        if (workspace) {
          // We can only handle root → child transfers, otherwise add to and run in current workspace
          const name = this.name === ROOT_WORKSPACE_NAME ? workspace.name : this.name;
          if (!configFilesMap.has(name)) configFilesMap.set(name, new Map());
          if (!configFilesMap.get(name)?.has(pluginName)) configFilesMap.get(name)?.set(pluginName, new Set());
          configFilesMap.get(name)?.get(pluginName)?.add(configFilePath);
        }
      }
    };

    for (const input of [...inputsFromManifest, ...productionInputsFromManifest]) {
      if (isConfig(input)) {
        handleConfigInput(input.pluginName, { ...input, containingFilePath });
      } else {
        if (!isProduction) addInput(input, containingFilePath);
        else if (isProduction && (input.production || hasProductionInput(input))) addInput(input, containingFilePath);
      }
    }

    const runPlugin = async (pluginName: PluginName, patterns: string[]) => {
      const plugin = Plugins[pluginName];
      const config = this.getConfigForPlugin(pluginName);

      if (!config) return;

      const label = 'config file';
      const configFilePaths = await _glob({ patterns, cwd: rootCwd, dir: cwd, gitignore: false, label });

      const options = {
        ...baseScriptOptions,
        config,
        configFilePath: containingFilePath,
        configFileDir: cwd,
        configFileName: '',
        getInputsFromScripts: createGetInputsFromScripts(containingFilePath),
      };

      if (config.entry) {
        const toInput = isProduction && plugin.production && plugin.production.length > 0 ? toProductionEntry : toEntry;
        for (const id of config.entry) addInput(toInput(id));
      } else if (
        (!plugin.resolveEntryPaths && !plugin.resolveFromAST) ||
        (configFilePaths.length === 0 &&
          (!this.configFilesMap.get(wsName)?.get(pluginName) ||
            this.configFilesMap.get(wsName)?.get(pluginName)?.size === 0))
      ) {
        if (plugin.entry) for (const id of plugin.entry) addInput(toEntry(id));
        if (plugin.production) for (const id of plugin.production) addInput(toProductionEntry(id));
      }

      for (const configFilePath of configFilePaths) {
        const isManifest = basename(configFilePath) === 'package.json';
        const fd = isManifest ? undefined : this.cache.getFileDescriptor(configFilePath);

        if (fd?.meta?.data && !fd.changed) {
          const data = fd.meta.data;
          if (data.resolveEntryPaths) for (const id of data.resolveEntryPaths) addInput(id, configFilePath);
          if (data.resolveConfig) for (const id of data.resolveConfig) addInput(id, configFilePath);
          if (data.resolveFromAST) for (const id of data.resolveFromAST) addInput(id, configFilePath);
          continue;
        }

        const resolveOpts = {
          ...options,
          getInputsFromScripts: createGetInputsFromScripts(configFilePath),
          configFilePath,
          configFileDir: dirname(configFilePath),
          configFileName: basename(configFilePath),
        };

        const seen = this.configFilesMap.get(wsName)?.get(pluginName)?.has(configFilePath);
        const cache: CacheItem = {};
        let loadedConfig: unknown;

        if (plugin.resolveEntryPaths && !seen) {
          if (!loadedConfig) loadedConfig = await loadConfigForPlugin(configFilePath, plugin, resolveOpts, pluginName);
          if (loadedConfig) {
            const inputs = await plugin.resolveEntryPaths(loadedConfig, resolveOpts);
            for (const input of inputs) addInput(input, configFilePath);
            cache.resolveEntryPaths = inputs;
          }
        }

        if (plugin.resolveConfig && !seen) {
          if (!loadedConfig) loadedConfig = await loadConfigForPlugin(configFilePath, plugin, resolveOpts, pluginName);
          if (loadedConfig) {
            const inputs = await plugin.resolveConfig(loadedConfig, resolveOpts);
            for (const input of inputs) addInput(input, configFilePath);
            cache.resolveConfig = inputs;
          }
        }

        if (plugin.resolveFromAST) {
          const sourceFile = this.getSourceFile(configFilePath);
          const resolveASTOpts = {
            ...resolveOpts,
            getSourceFile: this.getSourceFile,
            getReferencedInternalFilePath: this.getReferencedInternalFilePath,
          };
          if (sourceFile) {
            const inputs = plugin.resolveFromAST(sourceFile, resolveASTOpts);
            for (const input of inputs) addInput(input, configFilePath);
            cache.resolveFromAST = inputs;
          }
        }

        if (basename(configFilePath) !== 'package.json') {
          addInput(toEntry(configFilePath));
          addInput(toConfig(pluginName, configFilePath));
        }

        if (!isManifest && fd?.changed && fd.meta) fd.meta.data = cache;
      }

      if (plugin.resolve) {
        const dependencies = (await plugin.resolve(options)) ?? [];
        for (const id of dependencies) addInput(id, containingFilePath);
      }
    };

    const enabledPluginTitles = this.enabledPlugins.map(name => Plugins[name].title);
    debugLogObject(this.name, 'Enabled plugins', enabledPluginTitles);

    for (const pluginName of this.enabledPlugins) {
      const patterns = [...this.getConfigurationFilePatterns(pluginName), ...(configFiles?.get(pluginName) ?? [])];
      configFiles?.delete(pluginName);
      await runPlugin(pluginName, compact(patterns));
      remainingPlugins.delete(pluginName);
    }

    {
      // Handle config files added from root or current workspace recursively
      const configFiles = this.configFilesMap.get(wsName);
      if (configFiles) {
        do {
          for (const [pluginName, dependencies] of configFiles.entries()) {
            configFiles.delete(pluginName);
            if (this.enabledPlugins.includes(pluginName)) await runPlugin(pluginName, Array.from(dependencies));
            else for (const id of dependencies) addInput(toEntry(id));
          }
        } while (remainingPlugins.size > 0 && configFiles.size > 0);
      }
    }

    debugLogArray(wsName, 'Plugin dependencies', () => compact(inputs.map(toDebugString)));

    return inputs;
  }

  public onDispose() {
    this.cache.reconcile();
  }
}
