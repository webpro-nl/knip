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
  WorkspaceConfiguration,
} from './types/config.js';
import type { PackageJson } from './types/package-json.js';
import type { DependencySet } from './types/workspace.js';
import { compact } from './util/array.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _glob, hasNoProductionSuffix, hasProductionSuffix, negate, prependDirToPattern } from './util/glob.js';
import { type ConfigInput, type Input, isConfig, toConfig, toDebugString, toEntry } from './util/input.js';
import { getKeysByValue } from './util/object.js';
import { basename, dirname, join } from './util/path.js';
import { getFinalEntryPaths, loadConfigForPlugin } from './util/plugin.js';

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  cwd: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  dependencies: DependencySet;
  getReferencedInternalFilePath: (input: Input) => string | undefined;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[];
  ignoredWorkspacePatterns: string[];
  enabledPluginsInAncestors: string[];
  isProduction: boolean;
  isStrict: boolean;
  isCache: boolean;
  cacheLocation: string;
  allConfigFilePaths: Set<string>;
  allConfigFilesMap: Map<string, Map<PluginName, Set<string>>>;
};

type CacheItem = { resolveEntryPaths?: Input[]; resolveConfig?: Input[] };

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
  getReferencedInternalFilePath: (input: Input) => string | undefined;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  isProduction;
  isStrict;
  rootIgnore: Configuration['ignore'];
  negatedWorkspacePatterns: string[] = [];
  ignoredWorkspacePatterns: string[] = [];

  enabledPluginsMap = initEnabledPluginsMap();
  enabledPlugins: PluginName[] = [];
  enabledPluginsInAncestors: string[];

  cache: CacheConsultant<CacheItem>;

  allConfigFilePaths: Set<string>;
  allConfigFilesMap: Map<string, Map<PluginName, Set<string>>>;

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
    isCache,
    cacheLocation,
    allConfigFilePaths,
    allConfigFilesMap,
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
    this.allConfigFilePaths = allConfigFilePaths;
    this.allConfigFilesMap = allConfigFilesMap;

    this.getReferencedInternalFilePath = getReferencedInternalFilePath;
    this.findWorkspaceByFilePath = findWorkspaceByFilePath;

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

  getPluginProjectFilePatterns() {
    const patterns: string[] = [];
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
    return [patterns, this.ignoredWorkspacePatterns.map(negate)].flat();
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
    const name = this.name;
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

    const addInput = (input: Input, containingFilePath = input.containingFilePath) =>
      inputs.push({ ...input, containingFilePath });

    const handleConfigInput = (pluginName: PluginName, input: ConfigInput) => {
      const configFilePath = this.getReferencedInternalFilePath(input);
      if (configFilePath) {
        const workspace = this.findWorkspaceByFilePath(configFilePath);
        if (workspace) {
          // We can only handle root → child transfers, otherwise add to and run in current workspace
          const name = this.name === ROOT_WORKSPACE_NAME ? workspace.name : this.name;
          const files = this.allConfigFilesMap;
          if (!files.has(name)) files.set(name, new Map());
          if (!files.get(name)?.has(pluginName)) files.get(name)?.set(pluginName, new Set());
          files.get(name)?.get(pluginName)?.add(configFilePath);
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
      const hasResolveEntryPaths = typeof plugin.resolveEntryPaths === 'function';
      const hasResolveConfig = typeof plugin.resolveConfig === 'function';
      const hasResolve = typeof plugin.resolve === 'function';
      const config = this.getConfigForPlugin(pluginName);

      if (!config) return;

      const label = 'config file';
      const configFilePaths = await _glob({ patterns, cwd: rootCwd, dir: cwd, gitignore: false, label });

      const remainingConfigFilePaths = configFilePaths.filter(filePath => !this.allConfigFilePaths.has(filePath));
      for (const filePath of remainingConfigFilePaths) {
        if (basename(filePath) !== 'package.json') {
          this.allConfigFilePaths.add(filePath);
          addInput(toEntry(filePath));
          addInput(toConfig(pluginName, filePath));
        }
      }

      const options = {
        ...baseScriptOptions,
        config,
        configFilePath: containingFilePath,
        configFileDir: cwd,
        configFileName: '',
        getInputsFromScripts: createGetInputsFromScripts(containingFilePath),
      };

      const configEntryPaths: Input[] = [];

      for (const configFilePath of remainingConfigFilePaths) {
        const opts = {
          ...options,
          getInputsFromScripts: createGetInputsFromScripts(configFilePath),
          configFilePath,
          configFileDir: dirname(configFilePath),
          configFileName: basename(configFilePath),
        };
        if (hasResolveEntryPaths || hasResolveConfig) {
          const isManifest = basename(configFilePath) === 'package.json';
          const fd = isManifest ? undefined : this.cache.getFileDescriptor(configFilePath);

          if (fd?.meta?.data && !fd.changed) {
            if (fd.meta.data.resolveEntryPaths)
              for (const id of fd.meta.data.resolveEntryPaths) configEntryPaths.push(id);
            if (fd.meta.data.resolveConfig) for (const id of fd.meta.data.resolveConfig) addInput(id, configFilePath);
          } else {
            const config = await loadConfigForPlugin(configFilePath, plugin, opts, pluginName);
            const data: CacheItem = {};
            if (config) {
              if (hasResolveEntryPaths) {
                const entryPaths = (await plugin.resolveEntryPaths?.(config, opts)) ?? [];
                for (const entryPath of entryPaths) configEntryPaths.push(entryPath);
                data.resolveEntryPaths = entryPaths;
              }
              if (hasResolveConfig) {
                const inputs = (await plugin.resolveConfig?.(config, opts)) ?? [];
                for (const input of inputs) {
                  if (isConfig(input)) {
                    handleConfigInput(input.pluginName, { ...input, containingFilePath: configFilePath });
                  } else {
                    addInput(input, configFilePath);
                  }
                }
                data.resolveConfig = inputs;
              }
              if (!isManifest && fd?.changed && fd.meta) fd.meta.data = data;
            }
          }
        }
      }

      const finalEntryPaths = getFinalEntryPaths(plugin, options, configEntryPaths);
      for (const id of finalEntryPaths) addInput(id, id.containingFilePath);

      if (hasResolve) {
        const dependencies = (await plugin.resolve?.(options)) ?? [];
        for (const id of dependencies) addInput(id, containingFilePath);
      }
    };

    const enabledPluginTitles = this.enabledPlugins.map(name => Plugins[name].title);
    debugLogObject(this.name, 'Enabled plugins', enabledPluginTitles);

    const configFiles = this.allConfigFilesMap.get(name);

    for (const pluginName of this.enabledPlugins) {
      const patterns = [...this.getConfigurationFilePatterns(pluginName), ...(configFiles?.get(pluginName) ?? [])];
      configFiles?.delete(pluginName);
      await runPlugin(pluginName, compact(patterns));
      remainingPlugins.delete(pluginName);
    }

    {
      // Handle config files added from root or current workspace recursively
      const configFiles = this.allConfigFilesMap.get(name);
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

    debugLogArray(name, 'Plugin dependencies', () => compact(inputs.map(toDebugString)));

    return inputs;
  }

  public onDispose() {
    this.cache.reconcile();
  }
}
