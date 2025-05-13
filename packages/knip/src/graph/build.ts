import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import type { PrincipalFactory } from '../PrincipalFactory.js';
import type { ProjectPrincipal } from '../ProjectPrincipal.js';
import { WorkspaceWorker } from '../WorkspaceWorker.js';
import { _getInputsFromScripts } from '../binaries/index.js';
import { getCompilerExtensions, getIncludedCompilers } from '../compilers/index.js';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import type { PluginName } from '../types/PluginNames.js';
import type { Tags } from '../types/cli.js';
import type { Report } from '../types/issues.js';
import type { ModuleGraph } from '../types/module-graph.js';
import { perfObserver } from '../util/Performance.js';
import { debugLog, debugLogArray } from '../util/debug.js';
import { getReferencedInputsHandler } from '../util/get-referenced-inputs.js';
import { _glob, negate } from '../util/glob.js';
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
import { getOrCreateFileNode, updateImportMap } from '../util/module-graph.js';
import { getEntryPathsFromManifest } from '../util/package-json.js';
import { dirname, isAbsolute, join, relative, toRelative } from '../util/path.js';
import {} from '../util/tag.js';
import { augmentWorkspace, getToSourcePathHandler, getToSourcePathsHandler } from '../util/to-source-path.js';
import { loadTSConfig } from '../util/tsconfig-loader.js';

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
    const { name, dir, ancestors, pkgName } = workspace;

    streamer.cast('Analyzing workspace', name);

    const manifest = chief.getManifestForWorkspace(name);

    if (!manifest) {
      continue;
    }

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
    const entryPathsFromManifest = getEntryPathsFromManifest(manifest);
    for (const filePath of await toSourceFilePaths(entryPathsFromManifest, dir, extensionGlobStr)) {
      inputs.add(toProductionEntry(filePath));
    }

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
        const label = 'production entry paths from plugins (skip exports analysis)';
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
        const label = 'entry paths';
        const patterns = worker.getEntryFilePatterns();
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, gitignore: false, label });
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const label = 'entry paths from plugins (skip exports analysis)';
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
        const label = 'project paths';
        const patterns = worker.getProjectFilePatterns([...productionPatternsSkipExports, ...projectFilePatterns]);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        for (const projectPath of workspaceProjectPaths) principal.addProjectPath(projectPath);
      }

      {
        const label = 'project paths from plugins';
        const patterns = worker.getPluginProjectFilePatterns();
        const pluginWorkspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        for (const projectPath of pluginWorkspaceProjectPaths) principal.addProjectPath(projectPath);
      }

      {
        const label = 'plugin configuration paths (skip exports analysis)';
        const patterns = worker.getPluginConfigPatterns();
        const configurationEntryPaths = await _glob({ ...sharedGlobOptions, patterns, label });
        principal.addEntryPaths(configurationEntryPaths, { skipExportsAnalysis: true });
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
      const { imports, exports, duplicates, scripts, traceRefs } = principal.analyzeSourceFile(
        filePath,
        {
          skipTypeOnly: isStrict,
          isFixExports,
          isFixTypes,
          ignoreExportsUsedInFile: chief.config.ignoreExportsUsedInFile,
          isReportClassMembers,
          tags,
        },
        isGitIgnored,
        isInternalWorkspace,
        getPrincipalByFilePath
      );

      const node = getOrCreateFileNode(graph, filePath);

      node.imports = imports;
      node.exports = exports;
      node.duplicates = duplicates;
      node.scripts = scripts;
      node.traceRefs = traceRefs;

      updateImportMap(node, imports.internal, graph);
      node.internalImportCache = imports.internal;

      graph.set(filePath, node);

      // A bit out of place, but good spot to add source files referenced from scripts recursively
      if (scripts && scripts.size > 0) {
        const dependencies = deputy.getDependencies(workspace.name);
        const manifestScriptNames = new Set(Object.keys(chief.getManifestForWorkspace(workspace.name)?.scripts ?? {}));
        const dir = dirname(filePath);
        const options = { cwd: dir, rootCwd: cwd, containingFilePath: filePath, dependencies, manifestScriptNames };
        const inputs = _getInputsFromScripts(scripts, options);
        for (const input of inputs) {
          input.containingFilePath ??= filePath;
          input.dir ??= dir;
          const specifierFilePath = getReferencedInternalFilePath(input, workspace);
          if (specifierFilePath) analyzeSourceFile(specifierFilePath, principal);
        }
      }
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
    perfObserver.addMemoryMark(factory.principals.size);
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
