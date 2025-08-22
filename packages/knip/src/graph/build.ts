import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import type { PrincipalFactory } from '../PrincipalFactory.js';
import type { ProjectPrincipal } from '../ProjectPrincipal.js';
import { WorkspaceWorker } from '../WorkspaceWorker.js';
import { _getInputsFromScripts } from '../binaries/index.js';
import { getCompilerExtensions, getIncludedCompilers } from '../compilers/index.js';
import { DEFAULT_EXTENSIONS, FOREIGN_FILE_EXTENSIONS } from '../constants.js';
import type { PluginName } from '../types/PluginNames.js';
import type { Tags } from '../types/cli.js';
import type { Report } from '../types/issues.js';
import type { ModuleGraph, UnresolvedImport } from '../types/module-graph.js';
import { perfObserver } from '../util/Performance.js';
import { debugLog, debugLogArray } from '../util/debug.js';
import { getReferencedInputsHandler } from '../util/get-referenced-inputs.js';
import { _glob, _syncGlob, negate } from '../util/glob.js';
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
import { getEntrySpecifiersFromManifest, getManifestImportDependencies } from '../util/package-json.js';
import { dirname, extname, isAbsolute, join, relative, toRelative } from '../util/path.js';
import { augmentWorkspace, getToSourcePathHandler, getToSourcePathsHandler } from '../util/to-source-path.js';

interface BuildOptions {
  cacheLocation: string;
  chief: ConfigurationChief;
  collector: IssueCollector;
  cwd: string;
  deputy: DependencyDeputy;
  factory: PrincipalFactory;
  gitignore: boolean;
  isCache: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  isGitIgnored: (path: string) => boolean;
  isIsolateWorkspaces: boolean;
  isProduction: boolean;
  isSkipLibs: boolean;
  isStrict: boolean;
  isWatch: boolean;
  report: Report;
  streamer: ConsoleStreamer;
  tags: Tags;
  tsConfigFile?: string;
  workspaces: Workspace[];
}

export async function build({
  cacheLocation,
  chief,
  collector,
  cwd,
  deputy,
  factory,
  gitignore,
  isCache,
  isFixExports,
  isFixTypes,
  isGitIgnored,
  isIsolateWorkspaces,
  isProduction,
  isSkipLibs,
  isStrict,
  isWatch,
  report,
  streamer,
  tags,
  tsConfigFile,
  workspaces,
}: BuildOptions) {
  const configFilesMap = new Map<string, Map<PluginName, Set<string>>>();

  const enabledPluginsStore = new Map<string, string[]>();

  const toSourceFilePath = getToSourcePathHandler(chief);
  const toSourceFilePaths = getToSourcePathsHandler(chief);

  const getReferencedInternalFilePath = getReferencedInputsHandler(collector, deputy, chief, isGitIgnored);

  const isReportClassMembers = report.classMembers;

  for (const workspace of workspaces) {
    const { name, dir, manifestPath, manifestStr } = workspace;
    const manifest = chief.getManifestForWorkspace(name);
    if (!manifest) continue;
    deputy.addWorkspace({ name, cwd, dir, manifestPath, manifestStr, manifest, ...chief.getIgnores(name) });
  }

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

    const tsConfigFilePath = join(dir, tsConfigFile ?? 'tsconfig.json');
    const { isFile, compilerOptions, definitionPaths } = await loadTSConfig(tsConfigFilePath);

    if (isFile) augmentWorkspace(workspace, dir, compilerOptions);

    const worker = new WorkspaceWorker({
      name,
      dir,
      cwd,
      config,
      manifest,
      dependencies,
      getReferencedInternalFilePath: (input: Input) => getReferencedInternalFilePath(input, workspace),
      findWorkspaceByFilePath: chief.findWorkspaceByFilePath.bind(chief),
      isProduction,
      isStrict,
      rootIgnore: chief.config.ignore,
      negatedWorkspacePatterns: chief.getNegatedWorkspacePatterns(name),
      ignoredWorkspacePatterns: chief.getIgnoredWorkspacesFor(name),
      enabledPluginsInAncestors: ancestors.flatMap(ancestor => enabledPluginsStore.get(ancestor) ?? []),
      getSourceFile: (filePath: string) => principal.backend.fileManager.getSourceFile(filePath),
      isCache,
      cacheLocation,
      configFilesMap,
    });

    await worker.init();

    const inputs = new Set<Input>();

    if (definitionPaths.length > 0) {
      debugLogArray(name, 'Definition paths', definitionPaths);
      for (const id of definitionPaths) inputs.add(toProductionEntry(id, { containingFilePath: tsConfigFilePath }));
    }

    const ignore = worker.getIgnorePatterns();
    const sharedGlobOptions = { cwd, dir, gitignore };

    collector.addIgnorePatterns(ignore.map(pattern => join(cwd, pattern)));

    // Add entry paths from package.json#main, #bin, #exports and apply source mapping
    const entrySpecifiersFromManifest = getEntrySpecifiersFromManifest(manifest);
    for (const filePath of await toSourceFilePaths(entrySpecifiersFromManifest, dir, extensionGlobStr)) {
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
    const principal = factory.createPrincipal({
      cwd: dir,
      isFile,
      compilerOptions,
      compilers,
      pkgName,
      isIsolateWorkspaces,
      isSkipLibs,
      isWatch,
      toSourceFilePath,
      isCache,
      cacheLocation,
      isProduction,
    });

    principal.addPaths(config.paths, dir);

    // Get dependencies from plugins
    const inputsFromPlugins = await worker.runPlugins();
    for (const id of inputsFromPlugins) inputs.add(Object.assign(id, { skipExportsAnalysis: !id.allowIncludeExports }));
    enabledPluginsStore.set(name, worker.enabledPlugins);

    const entryPatterns = new Set<string>();
    const entryPatternsSkipExports = new Set<string>();
    const productionPatterns = new Set<string>();
    const productionPatternsSkipExports = new Set<string>();
    const projectFilePatterns = new Set<string>();

    for (const input of inputs) {
      const specifier = input.specifier;
      if (isEntry(input)) {
        const relativePath = isAbsolute(specifier) ? relative(dir, specifier) : specifier;
        if (!input.skipExportsAnalysis) {
          entryPatterns.add(relativePath);
        } else {
          entryPatternsSkipExports.add(relativePath);
        }
      } else if (isProductionEntry(input)) {
        const relativePath = isAbsolute(specifier) ? relative(dir, specifier) : specifier;
        if (!input.skipExportsAnalysis) {
          productionPatterns.add(relativePath);
        } else {
          productionPatternsSkipExports.add(relativePath);
        }
      } else if (isProject(input)) {
        projectFilePatterns.add(isAbsolute(specifier) ? relative(dir, specifier) : specifier);
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
            productionPatternsSkipExports.add(resolvedFilePath);
          } else if (isDeferResolveEntry(input)) {
            if (!isProduction || !input.optional) entryPatternsSkipExports.add(resolvedFilePath);
          } else {
            principal.addEntryPath(resolvedFilePath, { skipExportsAnalysis: true });
          }
        }
      }
    }

    if (isProduction) {
      const negatedEntryPatterns: string[] = [...entryPatterns, ...entryPatternsSkipExports].map(negate);

      {
        const label = 'entry paths';
        const patterns = worker.getProductionEntryFilePatterns(negatedEntryPatterns);
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, gitignore: false, label });
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const label = 'production entry paths from plugins (ignore exports)';
        const patterns = Array.from(productionPatternsSkipExports);
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const label = 'production entry paths from plugins';
        const patterns = Array.from(productionPatterns);
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(pluginWorkspaceEntryPaths);
      }

      {
        const label = 'project paths';
        const patterns = worker.getProductionProjectFilePatterns(negatedEntryPatterns);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        for (const projectPath of workspaceProjectPaths) principal.addProjectPath(projectPath);
      }
    } else {
      {
        const label = 'entry paths from plugins (ignore exports)';
        const patterns = worker.getPluginEntryFilePatterns([
          ...entryPatternsSkipExports,
          ...productionPatternsSkipExports,
        ]);
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const label = 'entry paths from plugins';
        const patterns = worker.getPluginEntryFilePatterns([...entryPatterns, ...productionPatterns]);
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(pluginWorkspaceEntryPaths);
      }

      {
        const label = 'entry paths';
        const patterns = worker.getEntryFilePatterns();
        const entryPaths = await _glob({ ...sharedGlobOptions, patterns, gitignore: false, label });

        const hints = worker.getConfigurationHints('entry', patterns, entryPaths, principal.entryPaths);
        for (const hint of hints) collector.addConfigurationHint(hint);

        principal.addEntryPaths(entryPaths);
      }

      {
        const label = 'project paths from plugins';
        const patterns = worker.getPluginProjectFilePatterns();
        const pluginWorkspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        for (const projectPath of pluginWorkspaceProjectPaths) principal.addProjectPath(projectPath);
      }

      {
        const label = 'plugin configuration paths (ignore exports)';
        const patterns = worker.getPluginConfigPatterns();
        const configurationEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(configurationEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const label = 'project paths';
        const patterns = worker.getProjectFilePatterns([...productionPatternsSkipExports, ...projectFilePatterns]);
        const projectPaths = await _glob({ ...sharedGlobOptions, patterns, label });

        const hints = worker.getConfigurationHints('project', config.project, projectPaths, principal.projectPaths);
        for (const hint of hints) collector.addConfigurationHint(hint);

        for (const projectPath of projectPaths) principal.addProjectPath(projectPath);
      }
    }

    // Add knip.ts (might import dependencies)
    if (chief.resolvedConfigFilePath) {
      principal.addEntryPath(chief.resolvedConfigFilePath, { skipExportsAnalysis: true });
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

  const analyzeSourceFile = (filePath: string, principal: ProjectPrincipal) => {
    if (!isWatch && analyzedFiles.has(filePath)) return;
    analyzedFiles.add(filePath);

    const workspace = chief.findWorkspaceByFilePath(filePath);

    if (workspace) {
      const file = principal.analyzeSourceFile(filePath, {
        skipTypeOnly: isStrict,
        isFixExports,
        isFixTypes,
        ignoreExportsUsedInFile: chief.config.ignoreExportsUsedInFile,
        isReportClassMembers,
        tags,
      });

      // Post-processing
      const _unresolved = new Set<UnresolvedImport>();
      for (const unresolvedImport of file.imports.unresolved) {
        const { specifier } = unresolvedImport;

        // Ignore Deno style http import specifiers
        if (specifier.startsWith('http')) continue;

        // All bets are off after failing to resolve module:
        // - either add to external dependencies if it quacks like that so it'll end up as unused or unlisted dependency
        // - or maintain unresolved status if not ignored and not foreign
        const sanitizedSpecifier = sanitizeSpecifier(specifier);
        if (isStartsLikePackageName(sanitizedSpecifier)) {
          file.imports.external.add(sanitizedSpecifier);
        } else {
          const isIgnored = isGitIgnored(join(dirname(filePath), sanitizedSpecifier));
          if (!isIgnored) {
            const ext = extname(sanitizedSpecifier);
            const hasIgnoredExtension = FOREIGN_FILE_EXTENSIONS.has(ext);
            if (!ext || (ext !== '.json' && !hasIgnoredExtension)) _unresolved.add(unresolvedImport);
          }
        }
      }

      for (const filePath of file.imports.resolved) {
        const isIgnored = isGitIgnored(filePath);
        if (!isIgnored) principal.addEntryPath(filePath, { skipExportsAnalysis: true });
      }

      for (const [specifier, specifierFilePath] of file.imports.specifiers) {
        const packageName = getPackageNameFromModuleSpecifier(specifier);
        if (packageName && isInternalWorkspace(packageName)) {
          file.imports.external.add(packageName);
          const principal = getPrincipalByFilePath(specifierFilePath);
          if (principal && !isGitIgnored(specifierFilePath)) {
            principal.addNonEntryPath(specifierFilePath);
          }
        }
      }

      if (file.scripts && file.scripts.size > 0) {
        const dependencies = deputy.getDependencies(workspace.name);
        const manifestScriptNames = new Set(Object.keys(chief.getManifestForWorkspace(workspace.name)?.scripts ?? {}));
        const dir = dirname(filePath);
        const options = { cwd: dir, rootCwd: cwd, containingFilePath: filePath, dependencies, manifestScriptNames };
        const inputs = _getInputsFromScripts(file.scripts, options);
        for (const input of inputs) {
          input.containingFilePath ??= filePath;
          input.dir ??= dir;
          const specifierFilePath = getReferencedInternalFilePath(input, workspace);
          if (specifierFilePath) principal.addEntryPath(specifierFilePath, { skipExportsAnalysis: true });
        }
      }

      const node = getOrCreateFileNode(graph, filePath);

      file.imports.unresolved = _unresolved;

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

    streamer.cast('Analyzing source files', toRelative(principal.cwd));

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
    if (isIsolateWorkspaces || (isSkipLibs && !isWatch)) {
      factory.deletePrincipal(principal);
      principals[i] = undefined;
    }
    perfObserver.addMemoryMark(factory.getPrincipalCount());
  }

  if (!isWatch && isSkipLibs && !isIsolateWorkspaces) {
    for (const principal of principals) {
      if (principal) factory.deletePrincipal(principal);
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
