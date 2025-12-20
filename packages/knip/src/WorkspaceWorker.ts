import picomatch from 'picomatch';
import { _getInputsFromScripts } from './binaries/index.js';
import { CacheConsultant } from './CacheConsultant.js';
import { isDefaultPattern, type Workspace } from './ConfigurationChief.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import { getFilteredScripts } from './manifest/helpers.js';
import { PluginEntries, Plugins } from './plugins.js';
import type {
  EnsuredPluginConfiguration,
  GetInputsFromScriptsPartial,
  GetSourceFile,
  HandleInput,
  WorkspaceConfiguration,
} from './types/config.js';
import type { ConfigurationHint } from './types/issues.js';
import type { PluginName } from './types/PluginNames.js';
import type { PackageJson } from './types/package-json.js';
import type { DependencySet } from './types/workspace.js';
import { compact } from './util/array.js';
import type { MainOptions } from './util/create-options.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { _glob, hasNoProductionSuffix, hasProductionSuffix, negate } from './util/glob.js';
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
import { timerify } from './util/Performance.js';
import { basename, dirname, join } from './util/path.js';
import { loadConfigForPlugin } from './util/plugin.js';
import { ELLIPSIS } from './util/string.js';

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  dependencies: DependencySet;
  handleInput: HandleInput;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  getSourceFile: GetSourceFile;
  negatedWorkspacePatterns: string[];
  ignoredWorkspacePatterns: string[];
  enabledPluginsInAncestors: string[];
  configFilesMap: Map<string, Map<PluginName, Set<string>>>;
  options: MainOptions;
};

type CacheItem = { resolveConfig?: Input[]; resolveFromAST?: Input[]; configFile?: Input };

const nullConfig: EnsuredPluginConfiguration = { config: null, entry: null, project: null };

const initEnabledPluginsMap = () =>
  Object.keys(Plugins).reduce(
    // biome-ignore lint: performance/noAccumulatingSpread
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
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  dependencies: DependencySet;
  handleInput: HandleInput;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  getSourceFile: GetSourceFile;
  negatedWorkspacePatterns: string[] = [];
  ignoredWorkspacePatterns: string[] = [];

  options: MainOptions;

  enabledPluginsMap = initEnabledPluginsMap();
  enabledPlugins: PluginName[] = [];
  enabledPluginsInAncestors: string[];

  cache: CacheConsultant<CacheItem>;

  configFilesMap: Map<string, Map<PluginName, Set<string>>>;

  constructor({
    name,
    dir,
    config,
    manifest,
    dependencies,
    negatedWorkspacePatterns,
    ignoredWorkspacePatterns,
    enabledPluginsInAncestors,
    handleInput,
    findWorkspaceByFilePath,
    getSourceFile,
    configFilesMap,
    options,
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.config = config;
    this.manifest = manifest;
    this.dependencies = dependencies;
    this.negatedWorkspacePatterns = negatedWorkspacePatterns;
    this.ignoredWorkspacePatterns = ignoredWorkspacePatterns;
    this.enabledPluginsInAncestors = enabledPluginsInAncestors;
    this.configFilesMap = configFilesMap;

    this.handleInput = handleInput;
    this.findWorkspaceByFilePath = findWorkspaceByFilePath;
    this.getSourceFile = getSourceFile;

    this.options = options;

    this.cache = new CacheConsultant(`plugins-${name}`, options);

    this.getConfigurationHints = timerify(this.getConfigurationHints.bind(this), 'worker.getConfigurationHints');
  }

  public async init() {
    this.enabledPlugins = await this.determineEnabledPlugins();
  }

  private async determineEnabledPlugins() {
    const manifest = this.manifest;

    for (const [pluginName, plugin] of PluginEntries) {
      if (this.config[pluginName] === false) continue;
      if (this.options.cwd !== this.dir && plugin.isRootOnly) continue;
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
    return [excludeProductionNegations, projectFilePatterns, this.negatedWorkspacePatterns].flat();
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

  public async runPlugins() {
    const wsName = this.name;
    const cwd = this.dir;
    const rootCwd = this.options.cwd;
    const manifest = this.manifest;
    const containingFilePath = join(cwd, 'package.json');
    const isProduction = this.options.isProduction;
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

    const configFilesMap = this.configFilesMap;
    const configFiles = this.configFilesMap.get(wsName);
    const seen = new Map<string, Set<string>>();

    const storeConfigFilePath = (pluginName: PluginName, input: ConfigInput) => {
      const configFilePath = this.handleInput(input);
      if (configFilePath) {
        const workspace = this.findWorkspaceByFilePath(configFilePath);
        if (workspace) {
          // TODO Are we handling root → child and vice-versa transfers properly?
          const name = this.name === ROOT_WORKSPACE_NAME ? workspace.name : this.name;
          if (!configFilesMap.has(name)) configFilesMap.set(name, new Map());
          if (!configFilesMap.get(name)?.has(pluginName)) configFilesMap.get(name)?.set(pluginName, new Set());
          configFilesMap.get(name)?.get(pluginName)?.add(configFilePath);
        }
      }
    };

    for (const input of [...inputsFromManifest, ...productionInputsFromManifest]) {
      if (isConfig(input)) {
        storeConfigFilePath(input.pluginName, { ...input, containingFilePath });
      } else if (!isProduction || (isProduction && (input.production || hasProductionInput(input)))) {
        inputs.push({ ...input, containingFilePath });
      }
    }

    const runPlugin = async (pluginName: PluginName, patterns: string[]) => {
      const plugin = Plugins[pluginName];
      const config = this.getConfigForPlugin(pluginName);

      if (!config) return [];

      const inputs: Input[] = [];
      const addInput = (input: Input, containingFilePath = input.containingFilePath) => {
        if (isConfig(input)) {
          storeConfigFilePath(input.pluginName, { ...input, containingFilePath });
        } else {
          inputs.push(Object.assign(input, { containingFilePath }));
        }
      };

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
        for (const id of config.entry) inputs.push(toInput(id));
      } else if (
        (!plugin.resolveConfig && !plugin.resolveFromAST) ||
        (configFilePaths.filter(path => basename(path) !== 'package.json').length === 0 &&
          (!this.configFilesMap.get(wsName)?.get(pluginName) ||
            this.configFilesMap.get(wsName)?.get(pluginName)?.size === 0))
      ) {
        if (plugin.entry) for (const id of plugin.entry) inputs.push(toEntry(id));
        if (plugin.production) for (const id of plugin.production) inputs.push(toProductionEntry(id));
      }

      for (const configFilePath of configFilePaths) {
        const isManifest = basename(configFilePath) === 'package.json';
        const fd = isManifest ? undefined : this.cache.getFileDescriptor(configFilePath);

        if (fd?.meta?.data && !fd.changed) {
          const data = fd.meta.data;
          if (data.resolveConfig) for (const id of data.resolveConfig) addInput(id, configFilePath);
          if (data.resolveFromAST) for (const id of data.resolveFromAST) addInput(id, configFilePath);
          if (data.configFile) addInput(data.configFile);
          continue;
        }

        const resolveOpts = {
          ...options,
          getInputsFromScripts: createGetInputsFromScripts(configFilePath),
          configFilePath,
          configFileDir: dirname(configFilePath),
          configFileName: basename(configFilePath),
        };

        const cache: CacheItem = {};

        const key = `${wsName}:${pluginName}`;
        if (plugin.resolveConfig && !seen.get(key)?.has(configFilePath)) {
          if (typeof plugin.setup === 'function') await plugin.setup(resolveOpts);
          const isLoad =
            typeof plugin.isLoadConfig === 'function' ? plugin.isLoadConfig(resolveOpts, this.dependencies) : true;

          const localConfig = isLoad && (await loadConfigForPlugin(configFilePath, plugin, resolveOpts, pluginName));
          if (localConfig) {
            const inputs = await plugin.resolveConfig(localConfig, resolveOpts);
            for (const input of inputs) addInput(input, configFilePath);
            cache.resolveConfig = inputs;
          }

          if (typeof plugin.teardown === 'function') await plugin.teardown(resolveOpts);
        }

        if (plugin.resolveFromAST) {
          const sourceFile = this.getSourceFile(configFilePath);
          const resolveASTOpts = { ...resolveOpts, getSourceFile: this.getSourceFile };
          if (sourceFile) {
            const inputs = plugin.resolveFromAST(sourceFile, resolveASTOpts);
            for (const input of inputs) addInput(input, configFilePath);
            cache.resolveFromAST = inputs;
          }
        }

        if (!isManifest) {
          inputs.push(toEntry(configFilePath));
          storeConfigFilePath(pluginName, toConfig(pluginName, configFilePath));
          cache.configFile = toEntry(configFilePath);

          if (fd?.changed && fd.meta && !seen.get(key)?.has(configFilePath)) {
            fd.meta.data = cache;
          }

          if (!seen.has(key)) seen.set(key, new Set());
          seen.get(key)?.add(configFilePath);
        }
      }

      if (plugin.resolve) {
        const dependencies = (await plugin.resolve(options)) ?? [];
        for (const id of dependencies) addInput(id, containingFilePath);
      }

      // Any negated pattern will move all plugin inputs to new group
      if (inputs.some(input => input.specifier.startsWith('!'))) for (const input of inputs) input.group = pluginName;

      return inputs;
    };

    const enabledPluginTitles = this.enabledPlugins.map(name => Plugins[name].title);
    debugLogObject(this.name, 'Enabled plugins', enabledPluginTitles);

    for (const pluginName of this.enabledPlugins) {
      const patterns = [...this.getConfigurationFilePatterns(pluginName), ...(configFiles?.get(pluginName) ?? [])];
      configFiles?.delete(pluginName);
      for (const input of await runPlugin(pluginName, compact(patterns))) inputs.push(input);
      remainingPlugins.delete(pluginName);
    }

    {
      // Handle config files added from root or current workspace recursively
      const configFiles = this.configFilesMap.get(wsName);
      if (configFiles) {
        do {
          for (const [pluginName, dependencies] of configFiles) {
            configFiles.delete(pluginName);
            if (this.enabledPlugins.includes(pluginName)) {
              for (const input of await runPlugin(pluginName, Array.from(dependencies))) inputs.push(input);
            } else for (const id of dependencies) inputs.push(toEntry(id));
          }
        } while (remainingPlugins.size > 0 && configFiles.size > 0);
      }
    }

    debugLogArray(wsName, 'Plugin dependencies', () => compact(inputs.map(input => toDebugString(input, rootCwd))));

    return inputs;
  }

  public getConfigurationHints(
    type: 'entry' | 'project',
    patterns: string[],
    filePaths: string[],
    includedPaths: Set<string>
  ) {
    const hints = new Set<ConfigurationHint>();
    const entries = this.config[type].filter(pattern => !pattern.startsWith('!'));
    const workspaceName = this.name;
    const userDefinedPatterns = entries.filter(id => !isDefaultPattern(type, id));

    if (userDefinedPatterns.length === 0) return hints;

    if (filePaths.length === 0) {
      const identifier = `[${entries[0]}${entries.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
      hints.add({ type: `${type}-empty`, identifier, workspaceName });
      return hints;
    }

    for (const pattern of patterns) {
      if (pattern.startsWith('!')) continue;
      const filePathOrPattern = join(this.dir, pattern.replace(/!$/, ''));
      if (includedPaths.has(filePathOrPattern)) {
        hints.add({ type: `${type}-redundant`, identifier: pattern, workspaceName });
      } else {
        const matcher = picomatch(filePathOrPattern);
        if (!filePaths.some(filePath => matcher(filePath))) {
          hints.add({ type: `${type}-empty`, identifier: pattern, workspaceName });
        }
      }
    }

    return hints;
  }

  public onDispose() {
    this.cache.reconcile();
  }
}
