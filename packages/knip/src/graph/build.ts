import { _getInputsFromScripts } from '../binaries/index.ts';
import type { CatalogCounselor } from '../CatalogCounselor.ts';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.ts';
import type { ConsoleStreamer } from '../ConsoleStreamer.ts';
import { getCompilerExtensions, getIncludedCompilers, normalizeCompilerExtension } from '../compilers/index.ts';
import { DEFAULT_EXTENSIONS, FOREIGN_FILE_EXTENSIONS, IS_DTS } from '../constants.ts';
import type { DependencyDeputy } from '../DependencyDeputy.ts';
import type { IssueCollector } from '../IssueCollector.ts';
import type { ProjectPrincipal } from '../ProjectPrincipal.ts';
import type { GetImportsAndExportsOptions, RegisterCompiler } from '../types/config.ts';
import type { Issue } from '../types/issues.ts';
import type { Import, ModuleGraph } from '../types/module-graph.ts';
import type { PluginName } from '../types/PluginNames.ts';
import { partition } from '../util/array.ts';
import { createInputHandler, type ExternalRefsFromInputs } from '../util/create-input-handler.ts';
import type { MainOptions } from '../util/create-options.ts';
import { debugLog, debugLogArray } from '../util/debug.ts';
import { existsSync } from 'node:fs';
import { tryRealpath } from '../util/fs.ts';
import { _glob, _syncGlob, negate, prependDirToPattern as prependDir } from '../util/glob.ts';
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
} from '../util/input.ts';
import { loadTSConfig } from '../util/load-tsconfig.ts';
import { createFileNode, updateImportMap } from '../util/module-graph.ts';
import { getPackageNameFromModuleSpecifier, isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.ts';
import { perfObserver } from '../util/Performance.ts';
import { getEntrySpecifiersFromManifest, getManifestImportDependencies } from '../util/package-json.ts';
import { dirname, extname, isAbsolute, isInNodeModules, join, relative } from '../util/path.ts';
import { augmentWorkspace, getToSourcePathsHandler } from '../util/to-source-path.ts';
import { WorkspaceWorker } from '../WorkspaceWorker.ts';

interface BuildOptions {
  chief: ConfigurationChief;
  collector: IssueCollector;
  counselor: CatalogCounselor;
  deputy: DependencyDeputy;
  principal: ProjectPrincipal;
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
  principal,
  isGitIgnored,
  streamer,
  workspaces,
  options,
}: BuildOptions) {
  const configFilesMap = new Map<string, Map<PluginName, Set<string>>>();

  const enabledPluginsStore = new Map<string, string[]>();
  const registeredVisitorPlugins = new Set<string>();

  const toSourceFilePaths = getToSourcePathsHandler(chief);

  const addIssue = (issue: Issue) => collector.addIssue(issue) && options.isWatch && collector.retainIssue(issue);

  const externalRefsFromInputs: ExternalRefsFromInputs | undefined = options.isSession ? new Map() : undefined;

  const handleInput = createInputHandler(deputy, chief, isGitIgnored, addIssue, externalRefsFromInputs, options);

  const rootManifest = chief.getManifestForWorkspace('.');

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

  collector.addIgnorePatterns(chief.config.ignore.map(id => ({ pattern: prependDir(options.cwd, id), id })));
  collector.addIgnoreFilesPatterns(chief.config.ignoreFiles.map(id => ({ pattern: prependDir(options.cwd, id), id })));

  if (options.configFilePath) {
    principal.addEntryPath(options.configFilePath, { skipExportsAnalysis: true });
  }

  for (const workspace of workspaces) {
    const { name, dir, ancestors, manifestPath: filePath } = workspace;

    streamer.cast('Analyzing workspace', name);

    const manifest = chief.getManifestForWorkspace(name);
    if (!manifest) continue;

    const dependencies = deputy.getDependencies(name);
    const baseConfig = chief.getConfigForWorkspace(name);

    const tsConfigFilePath = join(dir, options.tsConfigFile ?? 'tsconfig.json');
    const { isFile, compilerOptions, fileNames } = await loadTSConfig(tsConfigFilePath);
    const [definitionPaths, tscSourcePaths] = partition(fileNames, filePath => IS_DTS.test(filePath));

    if (isFile) augmentWorkspace(workspace, dir, compilerOptions);

    const worker = new WorkspaceWorker({
      name,
      dir,
      config: baseConfig,
      manifest,
      dependencies,
      rootManifest,
      handleInput: (input: Input) => handleInput(input, workspace),
      findWorkspaceByFilePath: chief.findWorkspaceByFilePath.bind(chief),
      negatedWorkspacePatterns: chief.getNegatedWorkspacePatterns(name),
      ignoredWorkspacePatterns: chief.getIgnoredWorkspacesFor(name),
      enabledPluginsInAncestors: ancestors.flatMap(ancestor => enabledPluginsStore.get(ancestor) ?? []),
      readFile: (filePath: string) => principal.readFile(filePath),
      configFilesMap,
      options,
    });

    await worker.init();

    const compilers = getIncludedCompilers(chief.config.syncCompilers, chief.config.asyncCompilers, dependencies);
    const registerCompiler: RegisterCompiler = async ({ extension, compiler }) => {
      const ext = normalizeCompilerExtension(extension);
      if (compilers[0].has(ext)) return;
      compilers[0].set(ext, compiler);
    };

    await worker.registerCompilers(registerCompiler);

    principal.addCompilers(compilers);

    const extensions = getCompilerExtensions(compilers);
    const extensionGlobStr = `.{${[...DEFAULT_EXTENSIONS, ...extensions].map(ext => ext.slice(1)).join(',')}}`;
    const config = chief.getConfigForWorkspace(name, extensions);
    worker.config = config;

    const inputs = new Set<Input>();

    if (definitionPaths.length > 0) {
      debugLogArray(name, 'Definition paths', definitionPaths);
      for (const id of definitionPaths)
        inputs.add(toProductionEntry(tryRealpath(id), { containingFilePath: tsConfigFilePath }));
    }

    const sharedGlobOptions = { cwd: options.cwd, dir, gitignore: options.gitignore };

    const fn = (id: string) => ({ pattern: prependDir(options.cwd, prependDir(name, id)), id, workspaceName: name });
    collector.addIgnorePatterns(config.ignore.map(fn));
    collector.addIgnoreFilesPatterns(config.ignoreFiles.map(fn));

    const entrySpecifiersFromManifest = getEntrySpecifiersFromManifest(manifest);
    const label = 'entry paths from package.json';
    for (const filePath of await toSourceFilePaths(entrySpecifiersFromManifest, dir, extensionGlobStr, label)) {
      inputs.add(toProductionEntry(filePath));
    }

    for (const identifier of entrySpecifiersFromManifest) {
      if (!identifier.startsWith('!') && !isGitIgnored(join(dir, identifier))) {
        const exists = identifier.includes('*')
          ? _syncGlob({ patterns: [identifier], cwd: dir }).length > 0
          : existsSync(join(dir, identifier));
        if (!exists) {
          collector.addConfigurationHint({ type: 'package-entry', filePath, identifier, workspaceName: name });
        }
      }
    }

    for (const dep of getManifestImportDependencies(manifest)) deputy.addReferencedDependency(name, dep);

    principal.addPaths(config.paths, dir);
    if (compilerOptions.rootDirs) principal.addRootDirs(compilerOptions.rootDirs);

    const inputsFromPlugins = await worker.runPlugins();
    for (const id of inputsFromPlugins) inputs.add(Object.assign(id, { skipExportsAnalysis: !id.allowIncludeExports }));
    enabledPluginsStore.set(name, worker.enabledPlugins);

    worker.registerVisitors({
      ctx: principal.pluginCtx,
      registerVisitor: visitors => principal.pluginVisitorObjects.push(visitors),
      registeredPlugins: registeredVisitorPlugins,
    });

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
      // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
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
        } else if (input.issueType === 'unresolved') {
          deputy.addIgnoredUnresolved(name, input.specifier);
        }
      } else if (!isConfig(input)) {
        const ws = (input.containingFilePath && chief.findWorkspaceByFilePath(input.containingFilePath)) || workspace;
        const resolvedFilePath = handleInput(input, ws);
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

    const userEntryPatterns = options.isProduction
      ? worker.getProductionEntryFilePatterns(negatedEntryPatterns)
      : worker.getEntryFilePatterns();
    const userEntryPaths = await _glob({
      ...sharedGlobOptions,
      patterns: userEntryPatterns,
      gitignore: false,
      label: 'entry paths',
    });

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

    if (!options.isProduction) {
      const hints = worker.getConfigurationHints('entry', userEntryPatterns, userEntryPaths, principal.entryPaths);
      for (const hint of hints) collector.addConfigurationHint(hint);
    }

    principal.addEntryPaths(userEntryPaths);

    if (options.isUseTscFiles && isFile) {
      const isIgnoredWorkspace = chief.createIgnoredWorkspaceMatcher(name, dir);
      debugLogArray(name, 'Using tsconfig files as project files', tscSourcePaths);
      for (const tscPath of tscSourcePaths) {
        const filePath = tryRealpath(tscPath);
        if (!isGitIgnored(filePath) && !isIgnoredWorkspace(filePath)) {
          principal.addProgramPath(filePath);
          principal.addProjectPath(filePath);
        }
      }
    } else {
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

    worker.onDispose();
    perfObserver.addMemoryMark(name);
  }

  debugLog('*', `Created 1 principal for ${workspaces.length} workspaces`);

  const graph: ModuleGraph = new Map();
  const analyzedFiles = new Set<string>();
  const unreferencedFiles = new Set<string>();
  const entryPaths = new Set<string>();

  const isInternalWorkspace = (packageName: string) => chief.availableWorkspacePkgNames.has(packageName);

  const analyzeOpts: GetImportsAndExportsOptions = {
    isFixExports: options.isFixUnusedExports,
    isFixTypes: options.isFixUnusedTypes,
    isReportExports: options.isReportExports,
    skipTypeOnly: options.isStrict,
    tags: options.tags,
  };

  const analyzeSourceFile = (
    filePath: string,
    pp: ProjectPrincipal,
    parseResult?: import('oxc-parser').ParseResult,
    sourceText?: string
  ) => {
    if (!options.isWatch && !options.isSession && analyzedFiles.has(filePath)) return;
    analyzedFiles.add(filePath);

    const workspace = chief.findWorkspaceByFilePath(filePath);

    if (workspace) {
      const file = pp.analyzeSourceFile(
        filePath,
        analyzeOpts,
        chief.config.ignoreExportsUsedInFile,
        parseResult,
        sourceText
      );

      const unresolvedImports = new Set<Import>();
      for (const unresolvedImport of file.imports.unresolved) {
        const { specifier } = unresolvedImport;

        if (specifier.startsWith('http')) continue;

        const sanitizedSpecifier = sanitizeSpecifier(specifier);
        if (isStartsLikePackageName(sanitizedSpecifier)) {
          file.imports.external.add({ ...unresolvedImport, specifier: sanitizedSpecifier });
        } else {
          if (!isGitIgnored(join(dirname(filePath), sanitizedSpecifier))) {
            const ext = extname(sanitizedSpecifier);
            if (!ext || (ext !== '.json' && !FOREIGN_FILE_EXTENSIONS.has(ext))) unresolvedImports.add(unresolvedImport);
          }
        }
      }

      for (const filePath of file.imports.programFiles) {
        const isIgnored = isGitIgnored(filePath);
        if (!isIgnored) pp.addProgramPath(filePath);
      }

      for (const filePath of file.imports.entryFiles) {
        const isIgnored = isGitIgnored(filePath);
        if (!isIgnored) pp.addEntryPath(filePath, { skipExportsAnalysis: true });
      }

      const wsDependencies = deputy.getDependencies(workspace.name);
      for (const _import of file.imports.imports) {
        if (!_import.filePath) continue;
        const packageName = getPackageNameFromModuleSpecifier(_import.specifier);
        if (!packageName) continue;
        const isWorkspace = isInternalWorkspace(packageName);
        if (isWorkspace || wsDependencies.has(packageName)) {
          file.imports.external.add({ ..._import, specifier: packageName });
          if (isWorkspace && !isGitIgnored(_import.filePath)) {
            pp.addProgramPath(_import.filePath);
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
          rootManifest,
        };
        const inputs = _getInputsFromScripts(file.scripts, opts);
        for (const input of inputs) {
          input.containingFilePath ??= filePath;
          input.dir ??= dir;
          const specifierFilePath = handleInput(input, workspace);
          if (specifierFilePath) pp.addEntryPath(specifierFilePath, { skipExportsAnalysis: true });
        }
      }

      file.imports.unresolved = unresolvedImports;

      const pluginRefs = externalRefsFromInputs?.get(filePath);
      if (pluginRefs) for (const ref of pluginRefs) file.imports.externalRefs.add(ref);

      const node = graph.get(filePath);
      if (node) {
        node.imports = file.imports;
        node.exports = file.exports;
        node.duplicates = file.duplicates;
        node.scripts = file.scripts;
        updateImportMap(node, file.imports.internal, graph);
        node.internalImportCache = file.imports.internal;
      } else {
        updateImportMap(file, file.imports.internal, graph);
        file.internalImportCache = file.imports.internal;
        graph.set(filePath, file);
      }
    }
  };

  principal.init();

  if (principal.asyncCompilers.size > 0) {
    streamer.cast('Running async compilers');
    await principal.runAsyncCompilers();
  }

  streamer.cast('Analyzing source files');

  principal.walkAndAnalyze((filePath, parseResult, sourceText) => {
    analyzeSourceFile(filePath, principal, parseResult, sourceText);
    const node = graph.get(filePath);
    if (!node) return;
    const paths: string[] = [];
    for (const importPath of node.imports.internal.keys()) {
      if (!isInNodeModules(importPath)) paths.push(importPath);
    }
    return paths;
  });

  for (const filePath of principal.getUnreferencedFiles()) unreferencedFiles.add(filePath);
  for (const filePath of principal.entryPaths) entryPaths.add(filePath);

  principal.reconcileCache(graph);

  perfObserver.addMemoryMark('build');

  if (externalRefsFromInputs) {
    for (const [filePath, refs] of externalRefsFromInputs) {
      if (!graph.has(filePath)) graph.set(filePath, createFileNode());
      // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
      for (const ref of refs) graph.get(filePath)!.imports.externalRefs.add(ref);
    }
  }

  return {
    graph,
    entryPaths,
    analyzedFiles,
    unreferencedFiles,
    analyzeSourceFile,
    enabledPluginsStore,
  };
}
