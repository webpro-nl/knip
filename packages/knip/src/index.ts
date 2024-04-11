import { CacheConsultant } from './CacheConsultant.js';
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
import { getFilteredScripts } from './manifest/helpers.js';
import type { CommandLineOptions } from './types/cli.js';
import type { SerializableExport, SerializableExportMap, SerializableExportMember } from './types/exports.js';
import type { SerializableImportMap } from './types/imports.js';
import { debugLog, debugLogArray, debugLogObject } from './util/debug.js';
import { getReExportingEntryFileHandler } from './util/get-reexporting-entry-file.js';
import { _glob, negate } from './util/glob.js';
import { getGitIgnoredFn } from './util/globby.js';
import { getHandler } from './util/handle-dependency.js';
import { getIsIdentifierReferencedHandler } from './util/is-identifier-referenced.js';
import { getEntryPathFromManifest, getPackageNameFromModuleSpecifier } from './util/modules.js';
import { dirname, join } from './util/path.js';
import { hasMatch } from './util/regex.js';
import { shouldIgnore } from './util/tag.js';
import { loadTSConfig } from './util/tsconfig-loader.js';
import { getHasStrictlyNsReferences, getType } from './util/type.js';

export type { RawConfiguration as KnipConfig } from './types/config.js';
export type { Preprocessor, Reporter, ReporterOptions } from './types/issues.js';

export const main = async (unresolvedConfiguration: CommandLineOptions) => {
  const {
    cwd,
    tsConfigFile,
    gitignore,
    isStrict,
    isProduction,
    isShowProgress,
    isIncludeEntryExports,
    isIncludeLibs,
    isIsolateWorkspaces,
    tags,
    isFix,
    fixTypes,
  } = unresolvedConfiguration;

  debugLogObject('*', 'Unresolved configuration (from CLI arguments)', unresolvedConfiguration);

  const chief = new ConfigurationChief({ cwd, isProduction, isStrict, isIncludeEntryExports });
  const deputy = new DependencyDeputy({ isProduction, isStrict });
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer({ isEnabled: isShowProgress });

  const isGitIgnored = await getGitIgnoredFn({ cwd, gitignore });

  streamer.cast('Reading workspace configuration(s)...');

  await chief.init();

  const workspaces = chief.getIncludedWorkspaces();
  const report = chief.getIncludedIssueTypes();
  const rules = chief.getRules();
  const filters = chief.getFilters();
  const fixer = new IssueFixer({ isEnabled: isFix, cwd, fixTypes });

  debugLogObject('*', 'Included issue types', report);

  const isReportDependencies = report.dependencies || report.unlisted || report.unresolved;
  const isReportValues = report.exports || report.nsExports || report.classMembers;
  const isReportTypes = report.types || report.nsTypes || report.enumMembers;
  const isReportClassMembers = report.classMembers;
  const isSkipLibs = !(isIncludeLibs || isReportClassMembers);

  const collector = new IssueCollector({ cwd, rules, filters });

  const enabledPluginsStore = new Map<string, string[]>();

  // TODO Organize better
  deputy.setIgnored(chief.config.ignoreBinaries, chief.config.ignoreDependencies);

  const o = () => workspaces.map(w => ({ pkgName: w.pkgName, name: w.name, config: w.config, ancestors: w.ancestors }));
  debugLogObject('*', 'Included workspaces', () => workspaces.map(w => w.pkgName));
  debugLogObject('*', 'Included workspace configs', o);

  for (const workspace of workspaces) {
    const { name, dir, ancestors, pkgName, manifestPath } = workspace;

    streamer.cast(`Analyzing workspace ${name}...`);

    const manifest = chief.getManifestForWorkspace(dir);
    const { ignoreBinaries, ignoreDependencies } = chief.getIgnores(name);

    if (!manifest) continue;

    deputy.addWorkspace({ name, cwd, dir, manifestPath, manifest, ignoreBinaries, ignoreDependencies });
    const dependencies = deputy.getDependencies(name);

    const compilers = getIncludedCompilers(chief.config.syncCompilers, chief.config.asyncCompilers, dependencies);
    const extensions = getCompilerExtensions(compilers);
    const config = chief.getConfigForWorkspace(name, extensions);

    const filteredScripts = getFilteredScripts({ isProduction, scripts: manifest.scripts });
    const manifestScripts = Object.values(filteredScripts);
    const manifestScriptNames = new Set(Object.keys(manifest.scripts ?? {}));

    const { compilerOptions, definitionPaths } = await loadTSConfig(join(dir, tsConfigFile ?? 'tsconfig.json'));

    const principal = factory.getPrincipal({
      cwd: dir,
      paths: config.paths,
      compilerOptions,
      compilers,
      pkgName,
      isGitIgnored,
      isIsolateWorkspaces,
      isSkipLibs,
    });

    const worker = new WorkspaceWorker({
      name,
      dir,
      cwd,
      config,
      manifest,
      dependencies,
      isProduction,
      isStrict,
      rootIgnore: chief.config.ignore,
      negatedWorkspacePatterns: chief.getNegatedWorkspacePatterns(name),
      enabledPluginsInAncestors: ancestors.flatMap(ancestor => enabledPluginsStore.get(ancestor) ?? []),
    });

    await worker.init();

    principal.addEntryPaths(definitionPaths);
    debugLogArray(name, 'Definition paths', definitionPaths);

    const ignore = worker.getIgnorePatterns();
    const sharedGlobOptions = { cwd, workingDir: dir, gitignore };

    collector.addIgnorePatterns(ignore.map(pattern => join(cwd, pattern)));

    {
      // Add dependencies from package.json
      const options = { manifestScriptNames, cwd: dir, dependencies };
      const dependenciesFromManifest = _getDependenciesFromScripts(manifestScripts, options);
      principal.addReferencedDependencies(name, new Set(dependenciesFromManifest.map(id => [manifestPath, id])));
    }

    {
      // Add entry paths from package.json
      const entryPathsFromManifest = await getEntryPathFromManifest(manifest, { ...sharedGlobOptions, ignore });
      debugLogArray(name, 'Entry paths in package.json', entryPathsFromManifest);
      principal.addEntryPaths(entryPathsFromManifest);
    }

    const { referencedDependencies, enabledPlugins, entryFilePatterns, productionEntryFilePatterns } =
      await worker.findDependenciesByPlugins();
    enabledPluginsStore.set(name, enabledPlugins);
    principal.addReferencedDependencies(name, referencedDependencies);

    if (isProduction) {
      const negatedEntryPatterns: string[] = Array.from(entryFilePatterns).map(negate);

      {
        const patterns = worker.getProductionEntryFilePatterns(negatedEntryPatterns);
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
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
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
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
        const patterns = [...entryFilePatterns, ...productionEntryFilePatterns];
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

  const analyzedFiles = new Set<string>();
  const exportedSymbols: SerializableExportMap = {};
  const importedSymbols: SerializableImportMap = {};
  const unreferencedFiles = new Set<string>();
  const entryPaths = new Set<string>();

  for (const principal of principals) {
    principal.init();

    const handleReferencedDependency = getHandler(collector, deputy, chief);

    for (const [containingFilePath, specifier, workspaceName] of principal.referencedDependencies) {
      const workspace = chief.findWorkspaceByName(workspaceName);
      if (workspace) handleReferencedDependency(specifier, containingFilePath, workspace, principal);
    }

    const specifierFilePaths = new Set<string>();

    const analyzeSourceFile = (filePath: string, _principal: ProjectPrincipal = principal) => {
      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (workspace) {
        const { imports, exports, scripts } = _principal.analyzeSourceFile(filePath, {
          skipTypeOnly: isStrict,
          isFixExports: fixer.isEnabled && fixer.isFixUnusedExports,
          isFixTypes: fixer.isEnabled && fixer.isFixUnusedTypes,
          ignoreExportsUsedInFile: Boolean(chief.config.ignoreExportsUsedInFile),
          isReportClassMembers,
          tags,
        });
        const { internal, external, unresolved } = imports;
        const { exported, duplicate } = exports;

        if (Object.keys(exported).length > 0) exportedSymbols[filePath] = exported;

        for (const [specifierFilePath, importItems] of Object.entries(internal)) {
          const packageName = getPackageNameFromModuleSpecifier(importItems.specifier);
          if (packageName && chief.availableWorkspacePkgNames.has(packageName)) {
            // Mark "external" imports from other local workspaces as used dependency
            external.add(packageName);
            if (_principal === principal) {
              const workspace = chief.findWorkspaceByFilePath(specifierFilePath);
              if (workspace) {
                const principal = factory.getPrincipalByPackageName(workspace.pkgName);
                if (principal && !isGitIgnored(specifierFilePath)) {
                  // Defer to outside loop to prevent potential duplicate analysis and/or infinite recursion
                  specifierFilePaths.add(specifierFilePath);
                }
              }
            }
          }

          if (!importedSymbols[specifierFilePath]) {
            importedSymbols[specifierFilePath] = importItems;
          } else {
            const importedModule = importedSymbols[specifierFilePath];
            for (const id of importItems.identifiers) importedModule.identifiers.add(id);
            for (const id of importItems.importedNs) importedModule.importedNs.add(id);
            for (const id of importItems.isReExportedBy) importedModule.isReExportedBy.add(id);
            for (const id of importItems.isReExportedNs) importedModule.isReExportedNs.add(id);
            if (importItems.hasStar) importedModule.hasStar = true;
            if (importItems.isReExport) importedModule.isReExport = true;
          }
        }

        for (const symbols of duplicate) {
          if (symbols.length > 1) {
            const symbol = symbols.map(s => s.symbol).join('|');
            collector.addIssue({ type: 'duplicates', filePath, symbol, symbols });
          }
        }

        for (const specifier of external) {
          const packageName = getPackageNameFromModuleSpecifier(specifier);
          const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
          if (!isHandled) collector.addIssue({ type: 'unlisted', filePath, symbol: specifier });
        }

        for (const unresolvedImport of unresolved) {
          const { specifier, pos, line, col } = unresolvedImport;
          collector.addIssue({ type: 'unresolved', filePath, symbol: specifier, pos, line, col });
        }

        for (const specifier of _getDependenciesFromScripts(scripts, {
          cwd: dirname(filePath),
          manifestScriptNames: new Set(),
          dependencies: deputy.getDependencies(workspace.name),
        })) {
          handleReferencedDependency(specifier, filePath, workspace, _principal);
        }
      }
    };

    streamer.cast('Running async compilers...');

    await principal.runAsyncCompilers();

    streamer.cast('Connecting the dots...');

    let size = principal.entryPaths.size;
    let round = 0;

    do {
      size = principal.entryPaths.size;
      const resolvedFiles = principal.getUsedResolvedFiles();
      const files = resolvedFiles.filter(filePath => !analyzedFiles.has(filePath));

      debugLogArray('*', `Analyzing used resolved files [P${principals.indexOf(principal) + 1}/${++round}]`, files);
      for (const filePath of files) {
        analyzeSourceFile(filePath);
        analyzedFiles.add(filePath);
      }
    } while (size !== principal.entryPaths.size);

    for (const specifierFilePath of specifierFilePaths) {
      if (!analyzedFiles.has(specifierFilePath)) {
        analyzedFiles.add(specifierFilePath);
        analyzeSourceFile(specifierFilePath, principal);
      }
    }

    for (const filePath of principal.getUnreferencedFiles()) unreferencedFiles.add(filePath);
    for (const filePath of principal.entryPaths) entryPaths.add(filePath);

    principal.reconcileCache(serializableMap);

    // Delete principals including TS programs for GC, except when we still need its `LS.findReferences`
    if (isSkipLibs) factory.deletePrincipal(principal);
  }

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(importedSymbols);

  const getReExportingEntryFile = getReExportingEntryFileHandler(entryPaths, exportedSymbols, importedSymbols);

  const isExportedItemReferenced = (exportedItem: SerializableExport | SerializableExportMember) =>
    exportedItem.refs > 0 &&
    (typeof chief.config.ignoreExportsUsedInFile === 'object'
      ? exportedItem.type !== 'unknown' && !!chief.config.ignoreExportsUsedInFile[exportedItem.type]
      : chief.config.ignoreExportsUsedInFile);

  if (isReportValues || isReportTypes) {
    streamer.cast('Analyzing source files...');

    for (const [filePath, exportItems] of Object.entries(exportedSymbols)) {
      const workspace = chief.findWorkspaceByFilePath(filePath);
      const principal = workspace && factory.getPrincipalByPackageName(workspace.pkgName);

      if (workspace) {
        const { isIncludeEntryExports } = workspace.config;

        // Bail out when in entry file (unless `isIncludeEntryExports`)
        if (!isIncludeEntryExports && entryPaths.has(filePath)) continue;

        const importsForExport = importedSymbols[filePath];

        for (const [identifier, exportedItem] of Object.entries(exportItems)) {
          // Skip tagged exports
          if (exportedItem.jsDocTags.includes('@public') || exportedItem.jsDocTags.includes('@beta')) continue;
          if (exportedItem.jsDocTags.includes('@alias')) continue;
          if (shouldIgnore(exportedItem.jsDocTags, tags)) continue;
          if (isProduction && exportedItem.jsDocTags.includes('@internal')) continue;

          if (importsForExport) {
            if (!isIncludeEntryExports) {
              if (getReExportingEntryFile(importsForExport, identifier, 0, filePath)) continue;
            }

            if (isIdentifierReferenced(filePath, identifier, importsForExport)) {
              if (report.enumMembers && exportedItem.type === 'enum') {
                for (const member of exportedItem.members) {
                  if (hasMatch(workspace.ignoreMembers, member.identifier)) continue;
                  if (shouldIgnore(member.jsDocTags, tags)) continue;

                  if (member.refs === 0) {
                    if (!isIdentifierReferenced(filePath, `${identifier}.${member.identifier}`, importsForExport)) {
                      collector.addIssue({
                        type: 'enumMembers',
                        filePath,
                        symbol: member.identifier,
                        parentSymbol: identifier,
                        pos: member.pos,
                        line: member.line,
                        col: member.col,
                      });
                    }
                  }
                }
              }

              if (principal && isReportClassMembers && exportedItem.type === 'class') {
                const members = exportedItem.members.filter(
                  member =>
                    !(hasMatch(workspace.ignoreMembers, member.identifier) || shouldIgnore(member.jsDocTags, tags))
                );
                for (const member of principal.findUnusedMembers(filePath, members)) {
                  collector.addIssue({
                    type: 'classMembers',
                    filePath,
                    symbol: member.identifier,
                    parentSymbol: exportedItem.identifier,
                    pos: member.pos,
                    line: member.line,
                    col: member.col,
                  });
                }
              }

              // This id was imported, so we bail out early
              continue;
            }
          }

          const [hasStrictlyNsReferences, namespace] = getHasStrictlyNsReferences(importsForExport);

          const isType = ['enum', 'type', 'interface'].includes(exportedItem.type);

          if (hasStrictlyNsReferences && ((!report.nsTypes && isType) || !(report.nsExports || isType))) continue;

          if (!isExportedItemReferenced(exportedItem)) {
            if (!isSkipLibs && principal?.hasReferences(filePath, exportedItem)) continue;

            const type = getType(hasStrictlyNsReferences, isType);
            collector.addIssue({
              type,
              filePath,
              symbol: identifier,
              symbolType: exportedItem.type,
              parentSymbol: namespace,
              pos: exportedItem.pos,
              line: exportedItem.line,
              col: exportedItem.col,
            });
            if (isType) fixer.addUnusedTypeNode(filePath, exportedItem.fixes);
            else fixer.addUnusedExportNode(filePath, exportedItem.fixes);
          }
        }
      }
    }
  }

  const unusedFiles = [...unreferencedFiles].filter(filePath => !analyzedFiles.has(filePath));

  collector.addFilesIssues(unusedFiles);

  collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

  if (isReportDependencies) {
    const { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues } = deputy.settleDependencyIssues();
    const { configurationHints } = deputy.getConfigurationHints();
    for (const issue of dependencyIssues) collector.addIssue(issue);
    if (!isProduction) for (const issue of devDependencyIssues) collector.addIssue(issue);
    for (const issue of optionalPeerDependencyIssues) collector.addIssue(issue);
    for (const hint of configurationHints) collector.addConfigurationHint(hint);
  }

  const unusedIgnoredWorkspaces = chief.getUnusedIgnoredWorkspaces();
  for (const identifier of unusedIgnoredWorkspaces) {
    collector.addConfigurationHint({ type: 'ignoreWorkspaces', identifier });
  }

  const { issues, counters, configurationHints } = collector.getIssues();

  if (isFix) {
    await fixer.fixIssues(issues);
  }

  streamer.clear();

  return { report, issues, counters, rules, configurationHints };
};
