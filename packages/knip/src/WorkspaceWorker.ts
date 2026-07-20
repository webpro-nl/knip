import picomatch from 'picomatch';
import { _getInputsFromScripts } from './binaries/index.ts';
import { CacheConsultant } from './CacheConsultant.ts';
import { isDefaultPattern, type Workspace } from './ConfigurationChief.ts';
import { DEFAULT_EXTENSIONS, ROOT_WORKSPACE_NAME } from './constants.ts';
import { getFilteredScripts } from './manifest/helpers.ts';
import { PluginEntries, Plugins } from './plugins.ts';
import type {
  EnsuredPluginConfiguration,
  GetInputsFromScriptsPartial,
  HandleInput,
  Plugin,
  RegisterCompiler,
  RegisterVisitorsOptions,
  SourceMap,
  WorkspaceConfiguration,
} from './types/config.ts';
import type { ConfigurationHint } from './types/issues.ts';
import type { PluginName } from './types/PluginNames.ts';
import type { PackageJson } from './types/package-json.ts';
import type { DependencySet } from './types/workspace.ts';
import { createManifest, type Manifest } from './util/package-json.ts';
import { collectStringLiterals, isExternalReExportsOnly } from './typescript/ast-helpers.ts';
import { _parseFile } from './typescript/ast-nodes.ts';
import { compact } from './util/array.ts';
import type { MainOptions } from './util/create-options.ts';
import { debugLogArray, debugLogObject } from './util/debug.ts';
import { _glob, hasNoProductionSuffix, hasProductionSuffix, negate } from './util/glob.ts';
import {
  type ConfigInput,
  type Input,
  isConfig,
  isDeferResolve,
  isDependency,
  toConfig,
  toDebugString,
  toEntry,
  toProductionEntry,
} from './util/input.ts';
import { getPackageNameFromSpecifier } from './util/modules.ts';
import { getKeysByValue } from './util/object.ts';
import { timerify } from './util/Performance.ts';
import { basename, dirname, isInternal, join, toRelative } from './util/path.ts';
import { extractPatternExtensions } from './util/pattern-extensions.ts';
import { formatCauseMessage } from './util/errors.ts';
import { logError } from './util/log.ts';
import { loadConfigForPlugin } from './util/plugin.ts';
import { ELLIPSIS } from './util/string.ts';

type WorkspaceManagerOptions = {
  name: string;
  dir: string;
  config: WorkspaceConfiguration;
  manifest: PackageJson;
  dependencies: DependencySet;
  rootManifest: Manifest | undefined;
  handleInput: HandleInput;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  getManifest: (dir: string) => Manifest | undefined;
  readFile: (filePath: string) => string;
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
  manifest: Manifest;
  rootManifest: Manifest | undefined;
  dependencies: DependencySet;
  handleInput: HandleInput;
  findWorkspaceByFilePath: (filePath: string) => Workspace | undefined;
  getManifest: (dir: string) => Manifest | undefined;
  readFile: (filePath: string) => string;
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
    rootManifest,
    negatedWorkspacePatterns,
    ignoredWorkspacePatterns,
    enabledPluginsInAncestors,
    handleInput,
    findWorkspaceByFilePath,
    getManifest,
    readFile,
    configFilesMap,
    options,
  }: WorkspaceManagerOptions) {
    this.name = name;
    this.dir = dir;
    this.config = config;
    this.manifest = createManifest(manifest);
    this.rootManifest = rootManifest;
    this.dependencies = dependencies;
    this.negatedWorkspacePatterns = negatedWorkspacePatterns;
    this.ignoredWorkspacePatterns = ignoredWorkspacePatterns;
    this.enabledPluginsInAncestors = enabledPluginsInAncestors;
    this.configFilesMap = configFilesMap;

    this.handleInput = handleInput;
    this.findWorkspaceByFilePath = findWorkspaceByFilePath;
    this.getManifest = getManifest;
    this.readFile = readFile;

    this.options = options;

    this.cache = new CacheConsultant(`plugins-${name}`, options);

    this.getConfigurationHints = timerify(this.getConfigurationHints.bind(this), 'getConfigurationHints');
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

  private getPluginConfig(plugin: Plugin) {
    return typeof plugin.config === 'function' ? plugin.config({ cwd: this.dir }) : plugin.config;
  }

  getPluginConfigPatterns() {
    const patterns: string[] = [];
    for (const [pluginName, plugin] of PluginEntries) {
      const pluginConfig = this.getConfigForPlugin(pluginName);
      if (this.enabledPluginsMap[pluginName] && pluginConfig) {
        patterns.push(...(pluginConfig.config ?? this.getPluginConfig(plugin) ?? []));
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
    return pluginConfig.config ?? this.getPluginConfig(plugin) ?? [];
  }

  public async registerCompilers(registerCompiler: RegisterCompiler) {
    const cwd = this.dir;
    const hasDependency = (packageName: string) => this.dependencies.has(packageName);
    for (const [pluginName, plugin] of PluginEntries) {
      if (!plugin.registerCompilers) continue;
      if (this.config[pluginName] === false) continue;
      if (this.options.cwd !== this.dir && plugin.isRootOnly) continue;
      await plugin.registerCompilers({ cwd, hasDependency, registerCompiler });
    }
  }

  public async resolveSourceMaps() {
    const options = {
      cwd: this.dir,
      rootCwd: this.options.cwd,
      manifest: this.manifest,
      rootManifest: this.rootManifest,
      dependencies: this.dependencies,
    };
    const pairs: SourceMap[] = [];
    for (const pluginName of this.enabledPlugins) {
      const plugin = Plugins[pluginName];
      if (!plugin.resolveSourceMap) continue;
      for (const pair of await plugin.resolveSourceMap(options)) pairs.push(pair);
    }
    return pairs;
  }

  public registerVisitors(options: RegisterVisitorsOptions) {
    for (const pluginName of this.enabledPlugins) {
      if (options.registeredPlugins.has(pluginName)) continue;
      const plugin = Plugins[pluginName];
      if (plugin.registerVisitors) {
        options.registeredPlugins.add(pluginName);
        plugin.registerVisitors(options);
      }
    }
  }

  public async runPlugins() {
    const wsName = this.name;
    const cwd = this.dir;
    const rootCwd = this.options.cwd;
    const manifest = this.manifest;
    const containingFilePath = join(cwd, 'package.json');
    const isProduction = this.options.isProduction;
    const knownBinsOnly = false;

    const rootManifest = this.rootManifest;
    const getManifest = this.getManifest;
    const baseOptions = { manifest, rootManifest, cwd, rootCwd, containingFilePath, knownBinsOnly, getManifest };

    // Get dependencies from package.json#scripts
    const baseScriptOptions = { ...baseOptions, isProduction, enabledPlugins: this.enabledPlugins };
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
    const enabledPlugins = new Set(this.enabledPlugins);

    const configFilesMap = this.configFilesMap;
    const seen = new Map<PluginName, Set<string>>();
    const parsedConfigCache = new Map<string, ReturnType<typeof _parseFile> | undefined>();

    const getSeenConfigFiles = (pluginName: PluginName) => {
      let configFilePaths = seen.get(pluginName);
      if (!configFilePaths) {
        configFilePaths = new Set();
        seen.set(pluginName, configFilePaths);
      }
      return configFilePaths;
    };

    const storeConfigFilePath = (pluginName: PluginName, input: ConfigInput) => {
      const configFilePath = this.handleInput(input);
      if (configFilePath) {
        const workspace = this.findWorkspaceByFilePath(configFilePath);
        if (workspace) {
          // TODO Are we handling root → child and vice-versa transfers properly?
          const name = this.name === ROOT_WORKSPACE_NAME ? workspace.name : this.name;
          if (name === wsName && seen.get(pluginName)?.has(configFilePath)) return;

          let configFiles = configFilesMap.get(name);
          if (!configFiles) {
            configFiles = new Map();
            configFilesMap.set(name, configFiles);
          }
          let configFilePaths = configFiles.get(pluginName);
          if (!configFilePaths) {
            configFilePaths = new Set();
            configFiles.set(pluginName, configFilePaths);
          }
          configFilePaths.add(configFilePath);
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

    const runPlugin = async (pluginName: PluginName, patterns: string[], isResolvedConfigFiles = false) => {
      const plugin = Plugins[pluginName];
      const config = this.getConfigForPlugin(pluginName);

      if (!config) return [];

      const inputs: Input[] = [];
      const seenConfigFiles = getSeenConfigFiles(pluginName);
      const addInput = (input: Input, containingFilePath = input.containingFilePath) => {
        if (isConfig(input)) {
          storeConfigFilePath(input.pluginName, { ...input, containingFilePath });
        } else {
          inputs.push(Object.assign(input, { containingFilePath }));
        }
      };

      const label = 'config file';
      const configFilePaths = await _glob({ patterns, cwd: rootCwd, dir: cwd, gitignore: false, label });
      if (isResolvedConfigFiles) {
        const foundConfigFilePaths = new Set(configFilePaths);
        for (const filePath of patterns) {
          if (!foundConfigFilePaths.has(filePath)) seenConfigFiles.add(filePath);
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

      if (typeof plugin.setup === 'function') await plugin.setup();

      for (const configFilePath of configFilePaths) {
        if (seenConfigFiles.has(configFilePath)) continue;
        seenConfigFiles.add(configFilePath);

        const isManifest = basename(configFilePath) === 'package.json';
        const fd = isManifest ? undefined : this.cache.getFileDescriptor(configFilePath);

        if (fd?.meta?.data && !fd.changed) {
          const data = fd.meta.data;
          if (data.resolveConfig) for (const id of data.resolveConfig) addInput(id, configFilePath);
          if (data.resolveFromAST) for (const id of data.resolveFromAST) addInput(id, configFilePath);
          if (data.configFile) addInput(data.configFile);
          continue;
        }

        let parsed: ReturnType<typeof _parseFile> | undefined;
        if (!isManifest) {
          if (parsedConfigCache.has(configFilePath)) {
            parsed = parsedConfigCache.get(configFilePath);
          } else {
            const sourceText = this.readFile(configFilePath);
            parsed = sourceText ? _parseFile(configFilePath, sourceText) : undefined;
            parsedConfigCache.set(configFilePath, parsed);
          }
        }

        const resolveOpts = {
          ...options,
          getInputsFromScripts: createGetInputsFromScripts(configFilePath),
          configFilePath,
          configFileDir: dirname(configFilePath),
          configFileName: basename(configFilePath),
        };

        const cache: CacheItem = {};
        let hasLoadConfigError = false;

        if (plugin.resolveConfig) {
          if (parsed && isExternalReExportsOnly(parsed)) {
            cache.resolveConfig = [];
          }

          if (!cache.resolveConfig) {
            const isLoad =
              typeof plugin.isLoadConfig === 'function' ? plugin.isLoadConfig(resolveOpts, this.dependencies) : true;
            if (isLoad) {
              try {
                const localConfig = await loadConfigForPlugin(configFilePath, plugin, resolveOpts, pluginName);
                if (localConfig) {
                  const inputs = await plugin.resolveConfig(localConfig, resolveOpts);
                  if (plugin.isFilterTransitiveDependencies && !isManifest) {
                    this.filterTransitiveDependencies(inputs, configFilePath);
                  }
                  for (const input of inputs) addInput(input, configFilePath);
                  cache.resolveConfig = inputs;
                }
              } catch (error) {
                if (!(error instanceof Error)) throw error;
                hasLoadConfigError = true;
                const relPath = toRelative(configFilePath, this.options.cwd);
                const cause = formatCauseMessage(error, this.options.cwd);
                logError(`Error loading ${relPath} (${cause})`);
                logError('Please fix or visit https://knip.dev/reference/known-issues');
              }
            }
          }
        }

        if (plugin.resolveFromAST && parsed) {
          const resolveASTOpts = { ...resolveOpts, readFile: this.readFile };
          const inputs = plugin.resolveFromAST(parsed.program, resolveASTOpts);
          for (const input of inputs) addInput(input, configFilePath);
          cache.resolveFromAST = inputs;
        }

        if (!isManifest) {
          inputs.push(toEntry(configFilePath));
          storeConfigFilePath(pluginName, toConfig(pluginName, configFilePath));
          cache.configFile = toEntry(configFilePath);

          if (hasLoadConfigError) {
            this.cache.removeEntry(configFilePath);
          } else if (fd?.meta) {
            fd.meta.data = cache;
          }
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
      const configFiles = this.configFilesMap.get(wsName);
      const patterns = [...this.getConfigurationFilePatterns(pluginName), ...(configFiles?.get(pluginName) ?? [])];
      configFiles?.delete(pluginName);
      for (const input of await runPlugin(pluginName, compact(patterns))) inputs.push(input);
    }

    {
      // Handle config files added from root or current workspace recursively
      const configFiles = this.configFilesMap.get(wsName);
      if (configFiles) {
        while (configFiles.size > 0) {
          const entry = configFiles.entries().next().value;
          if (!entry) break;

          const [pluginName, dependencies] = entry;
          configFiles.delete(pluginName);
          if (enabledPlugins.has(pluginName)) {
            const seenConfigFiles = getSeenConfigFiles(pluginName);
            const unprocessed: string[] = [];
            for (const filePath of dependencies) {
              if (!seenConfigFiles.has(filePath)) unprocessed.push(filePath);
            }
            if (unprocessed.length > 0) {
              for (const input of await runPlugin(pluginName, unprocessed, true)) inputs.push(input);
            }
          } else {
            for (const id of dependencies) inputs.push(toEntry(id));
          }
        }
      }
    }

    debugLogArray(wsName, 'Plugin dependencies', () => compact(inputs.map(input => toDebugString(input, rootCwd))));

    return inputs;
  }

  private filterTransitiveDependencies(inputs: Input[], configFilePath: string) {
    const literals = new Set<string>();
    const visited = new Set<string>();
    const collect = (filePath: string) => {
      if (visited.has(filePath)) return;
      visited.add(filePath);
      const sourceText = this.readFile(filePath);
      if (!sourceText) return;
      for (const literal of collectStringLiterals(sourceText, filePath)) {
        literals.add(literal);
        if (isInternal(literal)) collect(join(dirname(filePath), literal));
      }
    };
    collect(configFilePath);
    for (const input of inputs) {
      if (!input.optional && (isDeferResolve(input) || isDependency(input))) {
        const name = getPackageNameFromSpecifier(input.specifier);
        if (name && !literals.has(name)) input.optional = true;
      }
    }
  }

  public getConfigurationHints(
    type: 'entry' | 'project',
    patterns: string[],
    filePaths: string[],
    includedPaths: Set<string>,
    compilerExtensions?: Set<string>
  ) {
    const hints: ConfigurationHint[] = [];
    const entries = this.config[type].filter(pattern => !pattern.startsWith('!'));
    const workspaceName = this.name;
    const userDefinedPatterns = entries.filter(id => !isDefaultPattern(type, id));

    if (userDefinedPatterns.length === 0) return hints;

    if (filePaths.length === 0) {
      const identifier = `[${entries[0]}${entries.length > 1 ? `, ${ELLIPSIS}` : ''}]`;
      hints.push({ type: `${type}-empty`, identifier, workspaceName });
      return hints;
    }

    for (const pattern of patterns) {
      if (pattern.startsWith('!')) continue;
      const filePathOrPattern = join(this.dir, pattern.replace(/!$/, ''));
      if (includedPaths.has(filePathOrPattern)) {
        hints.push({ type: `${type}-redundant`, identifier: pattern, workspaceName });
      } else {
        const matcher = picomatch(filePathOrPattern);
        if (!filePaths.some(filePath => matcher(filePath))) {
          hints.push({ type: `${type}-empty`, identifier: pattern, workspaceName });
        }
      }
    }

    if (type === 'project' && compilerExtensions) {
      const seen = new Set<string>();
      const patternExtensions = new Set<string>();
      for (const pattern of userDefinedPatterns) {
        for (const ext of extractPatternExtensions(pattern)) {
          patternExtensions.add(ext);
          if (seen.has(ext) || DEFAULT_EXTENSIONS.has(ext) || compilerExtensions.has(ext)) continue;
          seen.add(ext);
          hints.push({ type: 'project-extension-unregistered', identifier: ext, workspaceName });
        }
      }
      if (patternExtensions.size > 0) {
        for (const ext of compilerExtensions) {
          if (patternExtensions.has(ext)) continue;
          hints.push({ type: 'project-extension-excluded', identifier: ext, workspaceName });
        }
      }
    }

    return hints;
  }

  public onDispose() {
    this.cache.reconcile();
  }
}
