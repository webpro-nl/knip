import { watch } from 'node:fs';
import { ConfigurationChief } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { IssueCollector } from './IssueCollector.js';
import { IssueFixer } from './IssueFixer.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import type { ProjectPrincipal } from './ProjectPrincipal.js';
import { WorkspaceWorker } from './WorkspaceWorker.js';
import { _getDependenciesFromScripts } from './binaries/index.js';
import { getCompilerExtensions, getIncludedCompilers } from './compilers/index.js';
import type { CommandLineOptions } from './types/cli.js';
import type { DependencyGraph, Export, ExportMember } from './types/dependency-graph.js';
import { debugLog, debugLogArray, debugLogObject } from './util/debug.js';
import { getOrCreateFileNode, updateImportMap } from './util/dependency-graph.js';
import { getGitIgnoredHandler } from './util/glob-core.js';
import { _glob, negate } from './util/glob.js';
import { getReferencedDependencyHandler } from './util/handle-referenced-dependency.js';
import { getHasStrictlyNsReferences, getType } from './util/has-strictly-ns-references.js';
import { type Input, isConfigPattern, isEntry, isProductionEntry, toProductionEntry } from './util/input.js';
import { getIsIdentifierReferencedHandler } from './util/is-identifier-referenced.js';
import { getPackageNameFromModuleSpecifier } from './util/modules.js';
import { getEntryPathsFromManifest } from './util/package-json.js';
import { dirname, isAbsolute, join, relative } from './util/path.js';
import { findMatch } from './util/regex.js';
import { getShouldIgnoreHandler, getShouldIgnoreTagHandler } from './util/tag.js';
import { augmentWorkspace, getToSourcePathHandler } from './util/to-source-path.js';
import { createAndPrintTrace, printTrace } from './util/trace.js';
import { loadTSConfig } from './util/tsconfig-loader.js';
import { getWatchHandler } from './util/watch.js';

export type { RawConfiguration as KnipConfig } from './types/config.js';
export type { Preprocessor, Reporter, ReporterOptions } from './types/issues.js';

export const main = async (unresolvedConfiguration: CommandLineOptions) => {
  const {
    cacheLocation,
    cwd,
    excludedIssueTypes,
    fixTypes,
    gitignore,
    includedIssueTypes,
    isCache,
    isDebug,
    isDependenciesShorthand,
    isExportsShorthand,
    isFilesShorthand,
    isFix,
    isHideConfigHints,
    isIncludeEntryExports,
    isIncludeLibs,
    isIsolateWorkspaces,
    isProduction,
    isRemoveFiles,
    isShowProgress,
    isStrict,
    isWatch,
    tags,
    tsConfigFile,
    workspace,
  } = unresolvedConfiguration;

  debugLogObject('*', 'Unresolved configuration (from CLI arguments)', unresolvedConfiguration);

  const chief = new ConfigurationChief({ cwd, isProduction, isStrict, isIncludeEntryExports, workspace });
  const deputy = new DependencyDeputy({ isProduction, isStrict });
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer({ isEnabled: isShowProgress });

  streamer.cast('Reading workspace configuration(s)...');

  await chief.init();

  const workspaces = chief.getIncludedWorkspaces();
  const report = chief.getIncludedIssueTypes({
    includedIssueTypes,
    excludedIssueTypes,
    isDependenciesShorthand,
    isExportsShorthand,
    isFilesShorthand,
  });
  const rules = chief.getRules();
  const filters = chief.getFilters();
  const fixer = new IssueFixer({ isEnabled: isFix, cwd, fixTypes, isRemoveFiles });

  debugLogObject('*', 'Included issue types', report);

  const isReportDependencies = report.dependencies || report.unlisted || report.unresolved;
  const isReportValues = report.exports || report.nsExports || report.classMembers;
  const isReportTypes = report.types || report.nsTypes || report.enumMembers;
  const isReportClassMembers = report.classMembers;
  const isSkipLibs = !(isIncludeLibs || isReportClassMembers);

  const collector = new IssueCollector({ cwd, rules, filters });

  const enabledPluginsStore = new Map<string, string[]>();

  const o = () => workspaces.map(w => ({ pkgName: w.pkgName, name: w.name, config: w.config, ancestors: w.ancestors }));
  debugLogObject('*', 'Included workspaces', () => workspaces.map(w => w.pkgName));
  debugLogObject('*', 'Included workspace configs', o);

  const isGitIgnored = await getGitIgnoredHandler({ cwd, gitignore });
  const toSourceFilePath = getToSourcePathHandler(chief);
  const getReferencedInternalFilePath = getReferencedDependencyHandler(collector, deputy, chief, isGitIgnored);
  const shouldIgnore = getShouldIgnoreHandler(isProduction);
  const shouldIgnoreTags = getShouldIgnoreTagHandler(tags);

  for (const workspace of workspaces) {
    const { name, dir, manifestPath } = workspace;
    const manifest = chief.getManifestForWorkspace(name);
    if (!manifest) continue;
    const { ignoreBinaries, ignoreDependencies } = chief.getIgnores(name);
    deputy.addWorkspace({ name, cwd, dir, manifestPath, manifest, ignoreBinaries, ignoreDependencies });
  }

  for (const workspace of workspaces) {
    const { name, dir, ancestors, pkgName } = workspace;

    streamer.cast(`Analyzing workspace ${name}...`);

    const manifest = chief.getManifestForWorkspace(name);

    if (!manifest) {
      continue;
    }

    const dependencies = deputy.getDependencies(name);

    const compilers = getIncludedCompilers(chief.config.syncCompilers, chief.config.asyncCompilers, dependencies);
    const extensions = getCompilerExtensions(compilers);
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
      isProduction,
      isStrict,
      rootIgnore: chief.config.ignore,
      negatedWorkspacePatterns: chief.getNegatedWorkspacePatterns(name),
      ignoredWorkspacePatterns: chief.getIgnoredWorkspacesFor(name),
      enabledPluginsInAncestors: ancestors.flatMap(ancestor => enabledPluginsStore.get(ancestor) ?? []),
      isCache,
      cacheLocation,
    });

    await worker.init();

    const deps = new Set<Input>();

    debugLogArray(name, 'Definition paths', definitionPaths);
    for (const id of definitionPaths) deps.add(toProductionEntry(id, { containingFilePath: tsConfigFilePath }));

    const ignore = worker.getIgnorePatterns();
    const sharedGlobOptions = { cwd, dir, gitignore };

    collector.addIgnorePatterns(ignore.map(pattern => join(cwd, pattern)));

    // Add entry paths from package.json#main, #bin, #exports
    const entryPathsFromManifest = await getEntryPathsFromManifest(manifest, { ...sharedGlobOptions, ignore });
    debugLogArray(name, 'Entry paths in package.json', entryPathsFromManifest);
    for (const id of entryPathsFromManifest.map(id => toProductionEntry(id))) deps.add(id);

    // Get dependencies from plugins
    const dependenciesFromPlugins = await worker.findDependenciesByPlugins();
    for (const id of dependenciesFromPlugins) deps.add(id);

    enabledPluginsStore.set(name, worker.enabledPlugins);

    // workspace + worker → principal
    const principal = factory.createPrincipal({
      cwd: dir,
      paths: config.paths,
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

    const entryFilePatterns = new Set<string>();
    const productionEntryFilePatterns = new Set<string>();

    for (const dependency of deps) {
      const s = dependency.specifier;
      if (isEntry(dependency)) {
        entryFilePatterns.add(isAbsolute(s) ? relative(dir, s) : s);
      } else if (isProductionEntry(dependency)) {
        productionEntryFilePatterns.add(isAbsolute(s) ? relative(dir, s) : s);
      } else if (!isConfigPattern(dependency)) {
        const ws =
          (dependency.containingFilePath && chief.findWorkspaceByFilePath(dependency.containingFilePath)) || workspace;
        const specifierFilePath = getReferencedInternalFilePath(dependency, ws);
        if (specifierFilePath) principal.addEntryPath(specifierFilePath);
      }
    }

    if (isProduction) {
      const negatedEntryPatterns: string[] = Array.from(entryFilePatterns).map(negate);

      {
        const patterns = worker.getProductionEntryFilePatterns(negatedEntryPatterns);
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, gitignore: false });
        debugLogArray(name, 'Entry paths', workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const patterns = Array.from(productionEntryFilePatterns);
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Production plugin entry paths', pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const patterns = worker.getProductionProjectFilePatterns(negatedEntryPatterns);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Project paths', workspaceProjectPaths);
        for (const projectPath of workspaceProjectPaths) principal.addProjectPath(projectPath);
      }
    } else {
      {
        const patterns = worker.getEntryFilePatterns();
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns, gitignore: false });
        debugLogArray(name, 'Entry paths', workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const patterns = worker.getProjectFilePatterns([...productionEntryFilePatterns]);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Project paths', workspaceProjectPaths);
        for (const projectPath of workspaceProjectPaths) principal.addProjectPath(projectPath);
      }

      {
        const patterns = worker.getPluginEntryFilePatterns([...entryFilePatterns, ...productionEntryFilePatterns]);
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Plugin entry paths', pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const patterns = worker.getPluginProjectFilePatterns();
        const pluginWorkspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Plugin project paths', pluginWorkspaceProjectPaths);
        for (const projectPath of pluginWorkspaceProjectPaths) principal.addProjectPath(projectPath);
      }

      {
        const patterns = worker.getPluginConfigPatterns();
        const configurationEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, 'Plugin configuration paths', configurationEntryPaths);
        principal.addEntryPaths(configurationEntryPaths, { skipExportsAnalysis: true });
      }
    }

    // Add knip.ts (might import dependencies)
    if (chief.resolvedConfigFilePath) {
      principal.addEntryPath(chief.resolvedConfigFilePath, { skipExportsAnalysis: true });
    }

    worker.onDispose();
  }

  const principals = factory.getPrincipals();

  debugLog('*', `Created ${principals.length} programs for ${workspaces.length} workspaces`);

  const graph: DependencyGraph = new Map();
  const analyzedFiles = new Set<string>();
  const unreferencedFiles = new Set<string>();
  const entryPaths = new Set<string>();

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, entryPaths);

  const isPackageNameInternalWorkspace = (packageName: string) => chief.availableWorkspacePkgNames.has(packageName);

  const getPrincipalByFilePath = (filePath: string) => {
    const workspace = chief.findWorkspaceByFilePath(filePath);
    if (workspace) return factory.getPrincipalByPackageName(workspace.pkgName);
  };

  const analyzeSourceFile = (filePath: string, principal: ProjectPrincipal) => {
    if (!isWatch && analyzedFiles.has(filePath)) return;
    analyzedFiles.add(filePath);

    const workspace = chief.findWorkspaceByFilePath(filePath);
    if (workspace) {
      const { imports, exports, scripts, traceRefs } = principal.analyzeSourceFile(
        filePath,
        {
          skipTypeOnly: isStrict,
          isFixExports: fixer.isEnabled && fixer.isFixUnusedExports,
          isFixTypes: fixer.isEnabled && fixer.isFixUnusedTypes,
          ignoreExportsUsedInFile: chief.config.ignoreExportsUsedInFile,
          isReportClassMembers,
          tags,
        },
        isGitIgnored,
        isPackageNameInternalWorkspace,
        getPrincipalByFilePath
      );

      const file = getOrCreateFileNode(graph, filePath);

      file.imports = imports;
      file.exports = exports;
      file.scripts = scripts;
      file.traceRefs = traceRefs;

      updateImportMap(file, imports.internal, graph);
      file.internalImportCache = imports.internal;

      graph.set(filePath, file);

      // Handle scripts here since they might lead to more entry files
      if (scripts && scripts.size > 0) {
        const dependencies = deputy.getDependencies(workspace.name);
        const manifestScriptNames = new Set<string>();
        const rootCwd = cwd;
        const options = {
          cwd: dirname(filePath),
          rootCwd,
          containingFilePath: filePath,
          dependencies,
          manifestScriptNames,
        };
        const specifiers = _getDependenciesFromScripts(scripts, options);
        for (const specifier of specifiers) {
          specifier.containingFilePath = filePath;
          specifier.dir = cwd;
          const specifierFilePath = getReferencedInternalFilePath(specifier, workspace);
          if (specifierFilePath) analyzeSourceFile(specifierFilePath, principal);
        }
      }
    }
  };

  for (const principal of principals) {
    principal.init();

    streamer.cast('Running async compilers...');

    await principal.runAsyncCompilers();

    streamer.cast('Analyzing source files...');

    let size = principal.entryPaths.size;
    let round = 0;

    do {
      size = principal.entryPaths.size;
      const resolvedFiles = principal.getUsedResolvedFiles();
      const files = resolvedFiles.filter(filePath => !analyzedFiles.has(filePath));

      debugLogArray('*', `Analyzing used resolved files [P${principals.indexOf(principal) + 1}/${++round}]`, files);
      for (const filePath of files) analyzeSourceFile(filePath, principal);
    } while (size !== principal.entryPaths.size);

    for (const filePath of principal.getUnreferencedFiles()) unreferencedFiles.add(filePath);
    for (const filePath of principal.entryPaths) entryPaths.add(filePath);

    principal.reconcileCache(graph);

    // Delete principals including TS programs for GC, except when we still need its `LS.findReferences`
    if (!isIsolateWorkspaces && isSkipLibs && !isWatch) factory.deletePrincipal(principal);
  }

  if (isIsolateWorkspaces) for (const principal of principals) factory.deletePrincipal(principal);

  const ignoreExportsUsedInFile = chief.config.ignoreExportsUsedInFile;
  const isExportedItemReferenced = (exportedItem: Export | ExportMember) =>
    exportedItem.refs[1] ||
    (exportedItem.refs[0] > 0 &&
      (typeof ignoreExportsUsedInFile === 'object'
        ? exportedItem.type !== 'unknown' && !!ignoreExportsUsedInFile[exportedItem.type]
        : ignoreExportsUsedInFile));

  const collectUnusedExports = async () => {
    if (isReportValues || isReportTypes) {
      streamer.cast('Connecting the dots...');

      for (const [filePath, file] of graph.entries()) {
        const exportItems = file.exports?.exported;

        if (!exportItems || exportItems.size === 0) continue;

        const workspace = chief.findWorkspaceByFilePath(filePath);

        if (workspace) {
          const { isIncludeEntryExports } = workspace.config;

          const principal = factory.getPrincipalByPackageName(workspace.pkgName);

          const isEntry = entryPaths.has(filePath);

          // Bail out when in entry file (unless `isIncludeEntryExports`)
          if (!isIncludeEntryExports && isEntry) {
            createAndPrintTrace(filePath, { isEntry });
            continue;
          }

          const importsForExport = file.imported;

          for (const [identifier, exportedItem] of exportItems.entries()) {
            if (!isFix && exportedItem.isReExport) continue;

            // Skip tagged exports
            if (shouldIgnore(exportedItem.jsDocTags)) continue;

            const isIgnored = shouldIgnoreTags(exportedItem.jsDocTags);

            if (importsForExport) {
              const { isReferenced, reExportingEntryFile, traceNode } = isIdentifierReferenced(
                filePath,
                identifier,
                isIncludeEntryExports
              );

              if ((isReferenced || exportedItem.refs[1]) && isIgnored) {
                for (const tagName of exportedItem.jsDocTags) {
                  if (tags[1].includes(tagName.replace(/^\@/, ''))) {
                    collector.addTagHint({ type: 'tag', filePath, identifier, tagName });
                  }
                }
              }

              if (isIgnored) continue;

              if (reExportingEntryFile) {
                if (!isIncludeEntryExports) {
                  createAndPrintTrace(filePath, { identifier, isEntry, hasRef: isReferenced });
                  continue;
                }
                // Skip exports if re-exported from entry file and tagged
                const reExportedItem = graph.get(reExportingEntryFile)?.exports.exported.get(identifier);
                if (reExportedItem && shouldIgnore(reExportedItem.jsDocTags)) continue;
              }

              if (traceNode) printTrace(traceNode, filePath, identifier);

              if (isReferenced) {
                if (report.enumMembers && exportedItem.type === 'enum') {
                  if (importsForExport.refs.has(identifier)) continue; // consider members referenced (isObjectEnumerationCallExpressionArgument)

                  for (const member of exportedItem.members) {
                    if (findMatch(workspace.ignoreMembers, member.identifier)) continue;
                    if (shouldIgnore(member.jsDocTags)) continue;

                    if (member.refs[0] === 0) {
                      const id = `${identifier}.${member.identifier}`;
                      const { isReferenced } = isIdentifierReferenced(filePath, id, true);
                      const isIgnored = shouldIgnoreTags(member.jsDocTags);

                      if (!isReferenced) {
                        if (isIgnored) continue;

                        const isIssueAdded = collector.addIssue({
                          type: 'enumMembers',
                          filePath,
                          workspace: workspace.name,
                          symbol: member.identifier,
                          parentSymbol: identifier,
                          pos: member.pos,
                          line: member.line,
                          col: member.col,
                        });

                        if (isFix && isIssueAdded && member.fix) fixer.addUnusedTypeNode(filePath, [member.fix]);
                      } else if (isIgnored) {
                        for (const tagName of exportedItem.jsDocTags) {
                          if (tags[1].includes(tagName.replace(/^\@/, ''))) {
                            collector.addTagHint({ type: 'tag', filePath, identifier: id, tagName });
                          }
                        }
                      }
                    }
                  }
                }

                if (principal && isReportClassMembers && exportedItem.type === 'class') {
                  const members = exportedItem.members.filter(
                    member => !(findMatch(workspace.ignoreMembers, member.identifier) || shouldIgnore(member.jsDocTags))
                  );
                  for (const member of principal.findUnusedMembers(filePath, members)) {
                    if (shouldIgnoreTags(member.jsDocTags)) {
                      const identifier = `${exportedItem.identifier}.${member.identifier}`;
                      for (const tagName of exportedItem.jsDocTags) {
                        if (tags[1].includes(tagName.replace(/^\@/, ''))) {
                          collector.addTagHint({ type: 'tag', filePath, identifier, tagName });
                        }
                      }
                      continue;
                    }

                    const isIssueAdded = collector.addIssue({
                      type: 'classMembers',
                      filePath,
                      workspace: workspace.name,
                      symbol: member.identifier,
                      parentSymbol: exportedItem.identifier,
                      pos: member.pos,
                      line: member.line,
                      col: member.col,
                    });

                    if (isFix && isIssueAdded && member.fix) fixer.addUnusedTypeNode(filePath, [member.fix]);
                  }
                }

                // This id was imported, so we bail out early
                continue;
              }
            }

            const [hasStrictlyNsRefs, namespace] = getHasStrictlyNsReferences(graph, importsForExport, identifier);

            const isType = ['enum', 'type', 'interface'].includes(exportedItem.type);

            if (hasStrictlyNsRefs && ((!report.nsTypes && isType) || !(report.nsExports || isType))) continue;

            if (!isExportedItemReferenced(exportedItem)) {
              if (isIgnored) continue;
              if (!isSkipLibs && principal?.hasExternalReferences(filePath, exportedItem)) continue;

              const type = getType(hasStrictlyNsRefs, isType);
              const isIssueAdded = collector.addIssue({
                type,
                filePath,
                workspace: workspace.name,
                symbol: identifier,
                symbolType: exportedItem.type,
                parentSymbol: namespace,
                pos: exportedItem.pos,
                line: exportedItem.line,
                col: exportedItem.col,
              });

              if (isFix && isIssueAdded) {
                if (isType) fixer.addUnusedTypeNode(filePath, exportedItem.fixes);
                else fixer.addUnusedExportNode(filePath, exportedItem.fixes);
              }
            }
          }
        }
      }
    }

    for (const [filePath, file] of graph.entries()) {
      const ws = chief.findWorkspaceByFilePath(filePath);

      if (ws) {
        if (file.exports?.duplicate) {
          for (const symbols of file.exports.duplicate) {
            if (symbols.length > 1) {
              const symbol = symbols.map(s => s.symbol).join('|');
              collector.addIssue({ type: 'duplicates', filePath, workspace: ws.name, symbol, symbols });
            }
          }
        }

        if (file.imports?.external) {
          for (const specifier of file.imports.external) {
            const packageName = getPackageNameFromModuleSpecifier(specifier);
            const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(ws, packageName);
            if (!isHandled) collector.addIssue({ type: 'unlisted', filePath, workspace: ws.name, symbol: specifier });
          }
        }

        if (file.imports?.unresolved) {
          for (const unresolvedImport of file.imports.unresolved) {
            const { specifier, pos, line, col } = unresolvedImport;
            collector.addIssue({ type: 'unresolved', filePath, workspace: ws.name, symbol: specifier, pos, line, col });
          }
        }
      }
    }

    const unusedFiles = [...unreferencedFiles].filter(filePath => !analyzedFiles.has(filePath));

    collector.addFilesIssues(unusedFiles);

    collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

    if (isReportDependencies) {
      const { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues } = deputy.settleDependencyIssues();
      for (const issue of dependencyIssues) collector.addIssue(issue);
      if (!isProduction) for (const issue of devDependencyIssues) collector.addIssue(issue);
      for (const issue of optionalPeerDependencyIssues) collector.addIssue(issue);

      deputy.removeIgnoredIssues(collector.getIssues());

      // Hints about ignored dependencies/binaries can be confusing/annoying/incorrect in production/strict mode
      if (!workspace && !isProduction && !isHideConfigHints) {
        const configurationHints = deputy.getConfigurationHints();
        for (const hint of configurationHints) collector.addConfigurationHint(hint);
      }
    }

    const unusedIgnoredWorkspaces = chief.getUnusedIgnoredWorkspaces();
    for (const identifier of unusedIgnoredWorkspaces) {
      collector.addConfigurationHint({ type: 'ignoreWorkspaces', identifier });
    }
  };

  // inspect(graph);

  await collectUnusedExports();

  const { issues, counters, tagHints, configurationHints } = collector.getIssues();

  if (isWatch) {
    const isIgnored = (filePath: string) =>
      filePath.startsWith(cacheLocation) || filePath.includes('/.git/') || isGitIgnored(filePath);

    const watchHandler = await getWatchHandler({
      analyzedFiles,
      analyzeSourceFile,
      chief,
      collector,
      collectUnusedExports,
      cwd,
      factory,
      graph,
      isDebug,
      isIgnored,
      report,
      streamer,
      unreferencedFiles,
    });

    watch('.', { recursive: true }, watchHandler);
  }

  if (isFix) await fixer.fixIssues(issues);

  if (!isWatch) streamer.clear();

  return { report, issues, counters, rules, tagHints, configurationHints };
};
