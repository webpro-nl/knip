import { _getInputsFromScripts } from '../binaries/index.js';
import type { CatalogCounselor } from '../CatalogCounselor.js';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import { getCompilerExtensions, getIncludedCompilers } from '../compilers/index.js';
import { DEFAULT_EXTENSIONS, FOREIGN_FILE_EXTENSIONS } from '../constants.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import type { PrincipalFactory } from '../PrincipalFactory.js';
import type { ProjectPrincipal } from '../ProjectPrincipal.js';
import type { GetImportsAndExportsOptions } from '../types/config.js';
import type { Issue } from '../types/issues.js';
import type { Import, ModuleGraph } from '../types/module-graph.js';
import type { PluginName } from '../types/PluginNames.js';
import type { MainOptions } from '../util/create-options.js';
import { debugLog, debugLogArray } from '../util/debug.js';
import { getReferencedInputsHandler } from '../util/get-referenced-inputs.js';
import { _glob, _syncGlob, negate, prependDirToPattern } from '../util/glob.js';
import {
  type Input,
  isAlias,
  isConfig,
  isDeferResolveEntry,
  isDeferResolveProductionEntry,
  isEntry,
  isIgnore,
  isProductionEntry,
  isProject,
  toProductionEntry,
} from '../util/input.js';
import { loadTSConfig } from '../util/load-tsconfig.js';
import { getOrCreateFileNode, updateImportMap } from '../util/module-graph.js';
import { getPackageNameFromModuleSpecifier, isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.js';
import { perfObserver } from '../util/Performance.js';
import { getEntrySpecifiersFromManifest, getManifestImportDependencies } from '../util/package-json.js';
import { dirname, extname, isAbsolute, join, relative, toRelative } from '../util/path.js';
import { augmentWorkspace, getToSourcePathHandler, getToSourcePathsHandler } from '../util/to-source-path.js';
import { WorkspaceWorker } from '../WorkspaceWorker.js';

interface BuildOptions {
  chief: ConfigurationChief;
  collector: IssueCollector;
  counselor: CatalogCounselor;
  deputy: DependencyDeputy;
  factory: PrincipalFactory;
  isGitIgnored: (path: string) => boolean;
  streamer: ConsoleStreamer;
  workspaces: Workspace[];
  options: MainOptions;
}

export async function build({
  chief,
  collector,
  counselor,
  deputy,
  factory,
  isGitIgnored,
  streamer,
  workspaces,
  options,
}: BuildOptions) {
  const configFilesMap = new Map<string, Map<PluginName, Set<string>>>();

  const enabledPluginsStore = new Map<string, string[]>();

  const toSourceFilePath = getToSourcePathHandler(chief);
  const toSourceFilePaths = getToSourcePathsHandler(chief);

  const addIssue = (issue: Issue) => collector.addIssue(issue) && options.isWatch && collector.retainIssue(issue);

  const getReferencedInternalFilePath = getReferencedInputsHandler(deputy, chief, isGitIgnored, addIssue);

  for (const workspace of workspaces) {
    const { name, dir, manifestPath, manifestStr } = workspace;
    const manifest = chief.getManifestForWorkspace(name);
    if (!manifest) continue;

    deputy.addWorkspace({
      name,
      cwd: options.cwd,
      dir,
      manifestPath,
      manifestStr,
      manifest,
      ...chief.getIgnores(name),
    });

    counselor.addWorkspace(manifest);
  }

  collector.addIgnorePatterns(chief.config.ignore.map(p => join(options.cwd, p)));
  collector.addIgnoreFilesPatterns(chief.config.ignoreFiles.map(p => join(options.cwd, p)));

  for (const workspace of workspaces) {
    const { name, dir, ancestors, pkgName, manifestPath: filePath } = workspace;

    streamer.cast('Analyzing workspace', name);

    const manifest = chief.getManifestForWorkspace(name);
    if (!manifest) continue;

    const dependencies = deputy.getDependencies(name);

    const compilers = getIncludedCompilers(chief.config.syncCompilers, chief.config.asyncCompilers, dependencies);
    const extensions = getCompilerExtensions(compilers);
    const extensionGlobStr = `.{${[...DEFAULT_EXTENSIONS, ...extensions].map(ext => ext.slice(1)).join(',')}}`;
    const config = chief.getConfigForWorkspace(name, extensions);

    const tsConfigFilePath = join(dir, options.tsConfigFile ?? 'tsconfig.json');
    const { isFile, compilerOptions, definitionPaths } = await loadTSConfig(tsConfigFilePath);

    if (isFile) augmentWorkspace(workspace, dir, compilerOptions);

    const worker = new WorkspaceWorker({
      name,
      dir,
      config,
      manifest,
      dependencies,
      getReferencedInternalFilePath: (input: Input) => getReferencedInternalFilePath(input, workspace),
      findWorkspaceByFilePath: chief.findWorkspaceByFilePath.bind(chief),
      negatedWorkspacePatterns: chief.getNegatedWorkspacePatterns(name),
      ignoredWorkspacePatterns: chief.getIgnoredWorkspacesFor(name),
      enabledPluginsInAncestors: ancestors.flatMap(ancestor => enabledPluginsStore.get(ancestor) ?? []),
      getSourceFile: (filePath: string) => principal.backend.fileManager.getSourceFile(filePath),
      configFilesMap,
      options,
    });

    await worker.init();

    const inputs = new Set<Input>();

    if (definitionPaths.length > 0) {
      debugLogArray(name, 'Definition paths', definitionPaths);
      for (const id of definitionPaths) inputs.add(toProductionEntry(id, { containingFilePath: tsConfigFilePath }));
    }

    const sharedGlobOptions = { cwd: options.cwd, dir, gitignore: options.gitignore };

    collector.addIgnorePatterns(config.ignore.map(p => join(options.cwd, prependDirToPattern(name, p))));
    collector.addIgnoreFilesPatterns(config.ignoreFiles.map(p => join(options.cwd, prependDirToPattern(name, p))));

    // Add entry paths from package.json#main, #bin, #exports and apply source mapping
    const entrySpecifiersFromManifest = getEntrySpecifiersFromManifest(manifest);
    const label = 'entry paths from package.json';
    for (const filePath of await toSourceFilePaths(entrySpecifiersFromManifest, dir, extensionGlobStr, label)) {
      inputs.add(toProductionEntry(filePath));
    }

    // Add configuration hints for missing package.json#main|exports|etc. targets (that aren't git-ignored)
    for (const identifier of entrySpecifiersFromManifest) {
      if (!identifier.startsWith('!') && !isGitIgnored(join(dir, identifier))) {
        const files = _syncGlob({ patterns: [identifier], cwd: dir });
        if (files.length === 0) {
          collector.addConfigurationHint({ type: 'package-entry', filePath, identifier, workspaceName: name });
        }
      }
    }

    // Consider dependencies in package.json#imports used
    for (const dep of getManifestImportDependencies(manifest)) deputy.addReferencedDependency(name, dep);

    // workspace + worker → principal
    const principal = factory.createPrincipal(options, {
      dir,
      isFile,
      compilerOptions,
      compilers,
      pkgName,
      toSourceFilePath,
    });

    principal.addPaths(config.paths, dir);

    // Get dependencies from plugins
    const inputsFromPlugins = await worker.runPlugins();
    for (const id of inputsFromPlugins) inputs.add(Object.assign(id, { skipExportsAnalysis: !id.allowIncludeExports }));
    enabledPluginsStore.set(name, worker.enabledPlugins);

    const DEFAULT_GROUP = 'default';
    type PatternMap = Map<string, Set<string>>;
    const createPatternMap = (): PatternMap => new Map([[DEFAULT_GROUP, new Set()]]);

    const groups = new Set([DEFAULT_GROUP]);
    const entryPatterns = createPatternMap();
    const entryPatternsSkipExports = createPatternMap();
    const productionPatterns = createPatternMap();
    const productionPatternsSkipExports = createPatternMap();
    const projectFilePatterns = new Set<string>();

    const addPattern = (map: PatternMap, input: Input, pattern: string) => {
      if (input.group && !map.has(input.group)) map.set(input.group, new Set());
      // biome-ignore lint/style/noNonNullAssertion: srsly
      map.get(input.group ?? DEFAULT_GROUP)!.add(pattern);
    };

    const toWorkspaceRelative = (path: string) => (isAbsolute(path) ? relative(dir, path) : path);

    for (const input of inputs) {
      if (input.group) groups.add(input.group);
      const specifier = input.specifier;
      if (isEntry(input)) {
        const targetMap = input.skipExportsAnalysis ? entryPatternsSkipExports : entryPatterns;
        addPattern(targetMap, input, toWorkspaceRelative(specifier));
      } else if (isProductionEntry(input)) {
        const targetMap = input.skipExportsAnalysis ? productionPatternsSkipExports : productionPatterns;
        addPattern(targetMap, input, toWorkspaceRelative(specifier));
      } else if (isProject(input)) {
        projectFilePatterns.add(toWorkspaceRelative(specifier));
      } else if (isAlias(input)) {
        principal.addPaths({ [input.specifier]: input.prefixes }, input.dir ?? dir);
      } else if (isIgnore(input)) {
        if (input.issueType === 'dependencies' || input.issueType === 'unlisted') {
          deputy.addIgnoredDependencies(name, input.specifier);
        } else if (input.issueType === 'binaries') {
          deputy.addIgnoredBinaries(name, input.specifier);
        }
      } else if (!isConfig(input)) {
        const ws = (input.containingFilePath && chief.findWorkspaceByFilePath(input.containingFilePath)) || workspace;
        const resolvedFilePath = getReferencedInternalFilePath(input, ws);
        if (resolvedFilePath) {
          if (isDeferResolveProductionEntry(input)) {
            addPattern(productionPatternsSkipExports, input, resolvedFilePath);
          } else if (isDeferResolveEntry(input)) {
            if (!options.isProduction || !input.optional) addPattern(entryPatternsSkipExports, input, resolvedFilePath);
          } else {
            principal.addEntryPath(resolvedFilePath, { skipExportsAnalysis: true });
          }
        }
      }
    }

    const negatedEntryPatterns: string[] = [];
    if (options.isProduction) {
      for (const map of [entryPatterns, entryPatternsSkipExports]) {
        for (const patterns of map.values()) for (const pattern of patterns) negatedEntryPatterns.push(negate(pattern));
      }
    }

    {
      const patterns = options.isProduction
        ? worker.getProductionEntryFilePatterns(negatedEntryPatterns)
        : worker.getEntryFilePatterns();
      const entryPaths = await _glob({ ...sharedGlobOptions, patterns, gitignore: false, label: 'entry paths' });

      if (!options.isProduction) {
        const hints = worker.getConfigurationHints('entry', patterns, entryPaths, principal.entryPaths);
        for (const hint of hints) collector.addConfigurationHint(hint);
      }

      principal.addEntryPaths(entryPaths);
    }

    for (const group of groups) {
      {
        const patterns = worker.getPluginEntryFilePatterns([
          ...((!options.isProduction && entryPatterns.get(group)) || []),
          ...((!options.isProduction && group === DEFAULT_GROUP && worker.getPluginConfigPatterns()) || []),
          ...(productionPatterns.get(group) ?? []),
        ]);
        const label = `entry paths from plugins${group !== DEFAULT_GROUP ? ` - ${group}` : ''}`;
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(pluginWorkspaceEntryPaths);
      }

      {
        const patterns = worker.getPluginEntryFilePatterns([
          ...((!options.isProduction && entryPatternsSkipExports.get(group)) || []),
          ...(productionPatternsSkipExports.get(group) ?? []),
        ]);
        const label = `entry paths from plugins (ignore exports)${group !== DEFAULT_GROUP ? ` - ${group}` : ''}`;
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }
    }

    {
      const patterns = options.isProduction
        ? worker.getProductionProjectFilePatterns(negatedEntryPatterns)
        : worker.getProjectFilePatterns([
            ...(productionPatternsSkipExports.get(DEFAULT_GROUP) ?? []),
            ...projectFilePatterns,
            ...worker.getPluginProjectFilePatterns(),
          ]);
      const projectPaths = await _glob({ ...sharedGlobOptions, patterns, label: 'project paths' });

      if (!options.isProduction) {
        const hints = worker.getConfigurationHints('project', config.project, projectPaths, principal.projectPaths);
        for (const hint of hints) collector.addConfigurationHint(hint);
      }

      for (const projectPath of projectPaths) principal.addProjectPath(projectPath);
    }

    // Add knip.ts (might import dependencies)
    if (options.configFilePath) {
      factory.getPrincipals().at(0)?.addEntryPath(options.configFilePath, { skipExportsAnalysis: true });
    }

    worker.onDispose();
  }

  const principals: Array<ProjectPrincipal | undefined> = factory.getPrincipals();

  debugLog('*', `Created ${principals.length} programs for ${workspaces.length} workspaces`);

  const graph: ModuleGraph = new Map();
  const analyzedFiles = new Set<string>();
  const unreferencedFiles = new Set<string>();
  const entryPaths = new Set<string>();

  const isInternalWorkspace = (packageName: string) => chief.availableWorkspacePkgNames.has(packageName);

  const getPrincipalByFilePath = (filePath: string) => {
    const workspace = chief.findWorkspaceByFilePath(filePath);
    if (workspace) return factory.getPrincipalByPackageName(workspace.pkgName);
  };

  const analyzeOpts: GetImportsAndExportsOptions = {
    isFixExports: options.isFixUnusedExports,
    isFixTypes: options.isFixUnusedTypes,
    isReportClassMembers: options.isReportClassMembers,
    skipTypeOnly: options.isStrict,
    tags: options.tags,
  };

  const analyzeSourceFile = (filePath: string, principal: ProjectPrincipal) => {
    if (!options.isWatch && !options.isSession && analyzedFiles.has(filePath)) return;
    analyzedFiles.add(filePath);

    const workspace = chief.findWorkspaceByFilePath(filePath);

    if (workspace) {
      const file = principal.analyzeSourceFile(filePath, analyzeOpts, chief.config.ignoreExportsUsedInFile);

      // Post-processing
      const unresolvedImports = new Set<Import>();
      for (const unresolvedImport of file.imports.unresolved) {
        const { specifier } = unresolvedImport;

        // Ignore Deno style http import specifiers
        if (specifier.startsWith('http')) continue;

        // All bets are off after failing to resolve module:
        // - either add to external dependencies if it quacks like that so it'll end up as unused or unlisted dependency
        // - or maintain unresolved status if not ignored and not foreign
        const sanitizedSpecifier = sanitizeSpecifier(specifier);
        if (isStartsLikePackageName(sanitizedSpecifier)) {
          file.imports.external.add({ ...unresolvedImport, specifier: sanitizedSpecifier });
        } else {
          const isIgnored = isGitIgnored(join(dirname(filePath), sanitizedSpecifier));
          if (!isIgnored) {
            const ext = extname(sanitizedSpecifier);
            const hasIgnoredExtension = FOREIGN_FILE_EXTENSIONS.has(ext);
            if (!ext || (ext !== '.json' && !hasIgnoredExtension)) unresolvedImports.add(unresolvedImport);
          }
        }
      }

      for (const filePath of file.imports.resolved) {
        const isIgnored = isGitIgnored(filePath);
        if (!isIgnored) principal.addEntryPath(filePath, { skipExportsAnalysis: true });
      }

      for (const _import of file.imports.imports) {
        if (_import.filePath) {
          const packageName = getPackageNameFromModuleSpecifier(_import.specifier);
          if (packageName && isInternalWorkspace(packageName)) {
            file.imports.external.add({ ..._import, specifier: packageName });
            const principal = getPrincipalByFilePath(_import.filePath);
            if (principal && !isGitIgnored(_import.filePath)) {
              principal.addNonEntryPath(_import.filePath);
            }
          }
        }
      }

      if (file.scripts && file.scripts.size > 0) {
        const dependencies = deputy.getDependencies(workspace.name);
        const manifestScriptNames = new Set(Object.keys(chief.getManifestForWorkspace(workspace.name)?.scripts ?? {}));
        const dir = dirname(filePath);
        const opts = {
          cwd: dir,
          rootCwd: options.cwd,
          containingFilePath: filePath,
          dependencies,
          manifestScriptNames,
        };
        const inputs = _getInputsFromScripts(file.scripts, opts);
        for (const input of inputs) {
          input.containingFilePath ??= filePath;
          input.dir ??= dir;
          const specifierFilePath = getReferencedInternalFilePath(input, workspace);
          if (specifierFilePath) principal.addEntryPath(specifierFilePath, { skipExportsAnalysis: true });
        }
      }

      const node = getOrCreateFileNode(graph, filePath);

      file.imports.unresolved = unresolvedImports;

      Object.assign(node, file);

      updateImportMap(node, file.imports.internal, graph);
      node.internalImportCache = file.imports.internal;

      graph.set(filePath, node);
    }
  };

  for (let i = 0; i < principals.length; ++i) {
    const principal = principals[i];
    if (!principal) continue;

    principal.init();

    if (principal.asyncCompilers.size > 0) {
      streamer.cast('Running async compilers');
      await principal.runAsyncCompilers();
    }

    streamer.cast('Analyzing source files', toRelative(principal.cwd, options.cwd));

    let size = principal.entryPaths.size;
    let round = 0;

    do {
      size = principal.entryPaths.size;
      const resolvedFiles = principal.getUsedResolvedFiles();
      const files = resolvedFiles.filter(filePath => !analyzedFiles.has(filePath));

      debugLogArray('*', `Analyzing used resolved files [P${i + 1}/${++round}]`, files);
      for (const filePath of files) analyzeSourceFile(filePath, principal);
    } while (size !== principal.entryPaths.size);

    for (const filePath of principal.getUnreferencedFiles()) unreferencedFiles.add(filePath);
    for (const filePath of principal.entryPaths) entryPaths.add(filePath);

    principal.reconcileCache(graph);

    // Delete principals including TS programs for GC, except when we still need its `LS.findReferences`
    if (options.isIsolateWorkspaces || (options.isSkipLibs && !options.isWatch && !options.isSession)) {
      factory.deletePrincipal(principal, options.cwd);
      principals[i] = undefined;
    }
    perfObserver.addMemoryMark(factory.getPrincipalCount());
  }

  if (!options.isWatch && !options.isSession && options.isSkipLibs && !options.isIsolateWorkspaces) {
    for (const principal of principals) {
      if (principal) factory.deletePrincipal(principal, options.cwd);
    }
    principals.length = 0;
  }

  return {
    graph,
    entryPaths,
    analyzedFiles,
    unreferencedFiles,
    analyzeSourceFile,
  };
}
