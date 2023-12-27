import { isGitIgnoredSync } from 'globby';
import micromatch from 'micromatch';
import { _getDependenciesFromScripts } from './binaries/index.js';
import { ConfigurationChief } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { IssueCollector } from './IssueCollector.js';
import { IssueFixer } from './IssueFixer.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import { ProjectPrincipal } from './ProjectPrincipal.js';
import { debugLogObject, debugLogArray, debugLog } from './util/debug.js';
import { _glob, negate } from './util/glob.js';
import {
  getEntryPathFromManifest,
  getPackageNameFromFilePath,
  getPackageNameFromModuleSpecifier,
  normalizeSpecifierFromFilePath,
} from './util/modules.js';
import { dirname, isInNodeModules, join, isInternal } from './util/path.js';
import { fromBinary, isBinary } from './util/protocols.js';
import { _resolveSpecifier } from './util/require.js';
import { loadTSConfig } from './util/tsconfig-loader.js';
import { WorkspaceWorker } from './WorkspaceWorker.js';
import type { Workspace } from './ConfigurationChief.js';
import type { CommandLineOptions } from './types/cli.js';
import type { SerializableExport, SerializableExportMember, SerializableExportMap } from './types/exports.js';
import type { SerializableImports, SerializableImportMap } from './types/imports.js';

type HandleReferencedDependencyOptions = {
  specifier: string;
  containingFilePath: string;
  principal: ProjectPrincipal;
  workspace: Workspace;
};

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
    isIsolateWorkspaces,
    isFix,
    fixTypes,
  } = unresolvedConfiguration;

  debugLogObject('*', 'Unresolved configuration (from CLI arguments)', unresolvedConfiguration);

  const chief = new ConfigurationChief({ cwd, isProduction, isStrict, isIncludeEntryExports });
  const deputy = new DependencyDeputy({ isProduction, isStrict });
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer({ isEnabled: isShowProgress });

  // Central function, to prevent `Path is not in cwd` errors from `globby`
  // Provide `cwd`, otherwise defaults to `process.cwd()` w/ incompatible slashes in Windows
  const isGitIgnored = gitignore ? isGitIgnoredSync({ cwd }) : () => false;

  streamer.cast('Reading workspace configuration(s)...');

  await chief.init();

  const compilers = chief.getCompilers();
  const workspaces = chief.getWorkspaces();
  const report = chief.getIssueTypesToReport();
  const rules = chief.getRules();
  const filters = chief.getFilters();
  const fixer = new IssueFixer({ isEnabled: isFix, cwd, fixTypes });

  const isReportDependencies = report.dependencies || report.unlisted || report.unresolved;
  const isReportValues = report.exports || report.nsExports || report.classMembers;
  const isReportTypes = report.types || report.nsTypes || report.enumMembers;

  const collector = new IssueCollector({ cwd, rules, filters });

  const enabledPluginsStore = new Map<string, string[]>();

  // TODO Organize better
  deputy.addIgnored(chief.config.ignoreBinaries, chief.config.ignoreDependencies);

  const o = () => workspaces.map(w => ({ pkgName: w.pkgName, name: w.name, config: w.config, ancestors: w.ancestors }));
  debugLogObject('*', 'Included workspaces', () => workspaces.map(w => w.pkgName));
  debugLogObject('*', 'Included workspace configs', o);

  const handleReferencedDependency = ({
    specifier,
    containingFilePath,
    principal,
    workspace,
  }: HandleReferencedDependencyOptions) => {
    if (isInternal(specifier)) {
      // Pattern: ./module.js, /abs/path/to/module.js, /abs/path/to/module/index.js, ./module.ts, ./module.d.ts
      const filePath = principal.resolveModule(specifier, containingFilePath)?.resolvedFileName;
      if (filePath) {
        const ignorePatterns = workspace.config.ignore.map(pattern => join(workspace.dir, pattern));
        const isIgnored = micromatch.isMatch(filePath, ignorePatterns);
        if (!isIgnored) principal.addEntryPath(filePath);
      } else {
        collector.addIssue({ type: 'unresolved', filePath: containingFilePath, symbol: specifier });
      }
    } else {
      if (isBinary(specifier)) {
        const binaryName = fromBinary(specifier);
        const isHandled = deputy.maybeAddReferencedBinary(workspace, binaryName);
        if (!isHandled) collector.addIssue({ type: 'binaries', filePath: containingFilePath, symbol: binaryName });
      } else {
        const packageName = isInNodeModules(specifier)
          ? getPackageNameFromFilePath(specifier) // Pattern: /abs/path/to/repo/node_modules/package/index.js
          : getPackageNameFromModuleSpecifier(specifier); // Patterns: package, @any/package, @local/package, self-ref

        const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
        if (!isHandled) collector.addIssue({ type: 'unlisted', filePath: containingFilePath, symbol: specifier });

        // Patterns: @local/package/file, self-reference/file, ./node_modules/@scope/pkg/tsconfig.json
        if (packageName && specifier !== packageName) {
          const otherWorkspace = chief.availableWorkspaceManifests.find(w => w.manifest.name === packageName);
          if (otherWorkspace) {
            const filePath = _resolveSpecifier(otherWorkspace.dir, normalizeSpecifierFromFilePath(specifier));
            if (filePath) {
              principal.addEntryPath(filePath, { skipExportsAnalysis: true });
            } else {
              collector.addIssue({ type: 'unresolved', filePath: containingFilePath, symbol: specifier });
            }
          }
        }
      }
    }
  };

  for (const workspace of workspaces) {
    const { name, dir, config, ancestors, pkgName, manifestPath, manifest } = workspace;
    const { paths, ignoreDependencies, ignoreBinaries } = config;

    streamer.cast(`Analyzing workspace ${name}...`);

    deputy.addWorkspace({ name, dir, manifestPath, manifest, ignoreDependencies, ignoreBinaries });

    const { compilerOptions, definitionPaths } = await loadTSConfig(join(dir, tsConfigFile ?? 'tsconfig.json'));

    const principal = factory.getPrincipal({
      cwd: dir,
      paths,
      compilerOptions,
      compilers,
      pkgName,
      isGitIgnored,
      isIsolateWorkspaces,
    });

    const worker = new WorkspaceWorker({
      name,
      dir,
      cwd,
      config,
      manifest,
      isProduction,
      isStrict,
      rootIgnore: chief.config.ignore,
      negatedWorkspacePatterns: chief.getNegatedWorkspacePatterns(name),
      enabledPluginsInAncestors: ancestors.flatMap(ancestor => enabledPluginsStore.get(ancestor) ?? []),
    });

    await worker.init();

    principal.addEntryPaths(definitionPaths);
    debugLogArray(name, `Definition paths`, definitionPaths);

    const ignore = worker.getIgnorePatterns();
    const sharedGlobOptions = { cwd, workingDir: dir, gitignore };

    collector.addIgnorePatterns(ignore.map(pattern => join(cwd, pattern)));

    const entryPathsFromManifest = await getEntryPathFromManifest(manifest, { ...sharedGlobOptions, ignore });
    debugLogArray(name, 'Entry paths in package.json', entryPathsFromManifest);
    principal.addEntryPaths(entryPathsFromManifest);

    // Get peerDependencies, installed binaries, entry files gathered through all plugins, and hand over
    // A bit of an entangled hotchpotch, but it's all related, and efficient in terms of reading package.json once, etc.
    const dependencies = await worker.findAllDependencies();
    const {
      referencedDependencies,
      hostDependencies,
      installedBinaries,
      hasTypesIncluded,
      enabledPlugins,
      entryFilePatterns,
      productionEntryFilePatterns,
    } = dependencies;

    deputy.addHostDependencies(name, hostDependencies);
    deputy.setInstalledBinaries(name, installedBinaries);
    deputy.setHasTypesIncluded(name, hasTypesIncluded);
    enabledPluginsStore.set(name, enabledPlugins);

    referencedDependencies.forEach(([containingFilePath, specifier]) => {
      handleReferencedDependency({ specifier, containingFilePath, principal, workspace });
    });

    if (isProduction) {
      const negatedEntryPatterns: string[] = entryFilePatterns.map(negate);

      {
        const patterns = worker.getProductionEntryFilePatterns(negatedEntryPatterns);
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, `Entry paths`, workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns: productionEntryFilePatterns });
        debugLogArray(name, `Production plugin entry paths`, pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const patterns = worker.getProductionProjectFilePatterns(negatedEntryPatterns);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, `Project paths`, workspaceProjectPaths);
        workspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
      }
    } else {
      {
        const patterns = worker.getEntryFilePatterns();
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, `Entry paths`, workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const patterns = worker.getProjectFilePatterns([...productionEntryFilePatterns]);
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, `Project paths`, workspaceProjectPaths);
        workspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
      }

      {
        const patterns = [...entryFilePatterns, ...productionEntryFilePatterns];
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, `Plugin entry paths`, pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths, { skipExportsAnalysis: true });
      }

      {
        const patterns = worker.getPluginProjectFilePatterns();
        const pluginWorkspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, `Plugin project paths`, pluginWorkspaceProjectPaths);
        pluginWorkspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
      }

      {
        const patterns = worker.getPluginConfigPatterns();
        const configurationEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(name, `Plugin configuration paths`, configurationEntryPaths);
        principal.addEntryPaths(configurationEntryPaths, { skipExportsAnalysis: true });
      }
    }

    // Add knip.ts (might import dependencies)
    if (chief.resolvedConfigFilePath) {
      principal.addEntryPath(chief.resolvedConfigFilePath, { skipExportsAnalysis: true });
    }
  }

  const principals = factory.getPrincipals();

  debugLog('*', `Created ${principals.length} programs for ${workspaces.length} workspaces`);

  const analyzedFiles = new Set<string>();
  const exportedSymbols: SerializableExportMap = {};
  const importedSymbols: SerializableImportMap = {};
  const unreferencedFiles = new Set<string>();
  const entryPaths = new Set<string>();

  for (const principal of principals) {
    const specifierFilePaths = new Set<string>();

    const analyzeSourceFile = (filePath: string, _principal: ProjectPrincipal = principal) => {
      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (workspace) {
        const { imports, exports, scripts } = _principal.analyzeSourceFile(filePath, {
          skipTypeOnly: isStrict,
          isFixExports: fixer.isEnabled && fixer.isFixUnusedExports,
          isFixTypes: fixer.isEnabled && fixer.isFixUnusedTypes,
          ignoreExportsUsedInFile: Boolean(chief.config.ignoreExportsUsedInFile),
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
                if (principal && !principal.isGitIgnored(specifierFilePath)) {
                  // Defer to outside loop to prevent potential duplicate analysis and/or infinite recursion
                  specifierFilePaths.add(specifierFilePath);
                }
              }
            }
          }

          if (!importedSymbols[specifierFilePath]) {
            importedSymbols[specifierFilePath] = importItems;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const importedModule = importedSymbols[specifierFilePath];
            for (const id of importItems.identifiers) importedModule.identifiers.add(id);
            for (const id of importItems.importedNs) importedModule.importedNs.add(id);
            for (const id of importItems.isReExportedBy) importedModule.isReExportedBy.add(id);
            for (const id of importItems.isReExportedNs) importedModule.isReExportedNs.add(id);
            if (importItems.hasStar) importedModule.hasStar = true;
            if (importItems.isReExport) importedModule.isReExport = true;
            // debug only:
            for (const id of importItems.isImportedBy) importedModule.isImportedBy.add(id);
          }
        }

        duplicate.forEach(symbols => {
          if (symbols.length > 1) {
            const symbol = symbols.map(s => s.symbol).join('|');
            collector.addIssue({ type: 'duplicates', filePath, symbol, symbols });
          }
        });

        external.forEach(specifier => {
          const packageName = getPackageNameFromModuleSpecifier(specifier);
          const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
          if (!isHandled) collector.addIssue({ type: 'unlisted', filePath, symbol: specifier });
        });

        unresolved.forEach(unresolvedImport => {
          const { specifier, pos, line, col } = unresolvedImport;
          collector.addIssue({ type: 'unresolved', filePath, symbol: specifier, pos, line, col });
        });

        _getDependenciesFromScripts(scripts, { cwd: dirname(filePath) }).forEach(specifier => {
          handleReferencedDependency({ specifier, containingFilePath: filePath, principal: _principal, workspace });
        });
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
      files.forEach(filePath => {
        analyzeSourceFile(filePath);
        analyzedFiles.add(filePath);
      });
    } while (size !== principal.entryPaths.size);

    specifierFilePaths.forEach(specifierFilePath => {
      if (!analyzedFiles.has(specifierFilePath)) {
        analyzedFiles.add(specifierFilePath);
        analyzeSourceFile(specifierFilePath, principal);
      }
    });

    principal.getUnreferencedFiles().forEach(filePath => unreferencedFiles.add(filePath));
    principal.entryPaths.forEach(filePath => entryPaths.add(filePath));
    factory.deletePrincipal(principal);
  }

  const isIdentifierImported = (
    filePath: string,
    identifier: string,
    importsForExport?: SerializableImports,
    depth: number = 0
  ): boolean => {
    if (!importsForExport) {
      return false;
    }

    if (importsForExport.identifiers.has(identifier)) {
      return true;
    }

    if (Array.from(importsForExport.importedNs).find(ns => importsForExport.identifiers.has(`${ns}.${identifier}`))) {
      return true;
    }

    if (
      Array.from(importsForExport.isReExportedAs).find(([file, ns]) =>
        isIdentifierImported(filePath, ns, importedSymbols[file], depth + 1)
      )
    ) {
      return true;
    }

    if (
      Array.from(importsForExport.isReExportedAsNs).find(([file, ns]) =>
        isIdentifierImported(filePath, `${ns}.${identifier}`, importedSymbols[file], depth + 1)
      )
    ) {
      return true;
    }

    const { isReExport, isReExportedBy } = importsForExport;
    const isImported = (file: string) => isIdentifierImported(filePath, identifier, importedSymbols[file], depth + 1);
    if (isReExport) return Array.from(isReExportedBy).some(isImported);
    return false;
  };

  const isExportedInEntryFile = (importedModule?: SerializableImports): boolean => {
    if (!importedModule) return false;
    const { isReExport, isReExportedBy } = importedModule;
    const hasFile = (file: string) => entryPaths.has(file) || isExportedInEntryFile(importedSymbols[file]);
    return isReExport ? Array.from(isReExportedBy).some(hasFile) : false;
  };

  const getReExportingEntryFile = (importedModule: SerializableImports | undefined, id: string): string | undefined => {
    if (!importedModule) return undefined;
    const { isReExport, isReExportedBy, isReExportedNs } = importedModule;
    if (isReExport) {
      for (const filePath of isReExportedBy) {
        if (entryPaths.has(filePath)) {
          if (entryPaths.has(filePath) && filePath in exportedSymbols && id in exportedSymbols[filePath]) {
            return filePath;
          } else if (importedModule.hasStar) {
            return filePath;
          }
        } else {
          return getReExportingEntryFile(importedSymbols[filePath], id);
        }
      }
      for (const [filePath, namespace] of isReExportedNs) {
        if (entryPaths.has(filePath)) {
          return filePath;
        } else {
          return getReExportingEntryFile(importedSymbols[filePath], namespace);
        }
      }
    }
  };

  const isExportedItemReferenced = (exportedItem: SerializableExport | SerializableExportMember) => {
    return (
      exportedItem.refs > 0 &&
      (typeof chief.config.ignoreExportsUsedInFile === 'object'
        ? exportedItem.type !== 'unknown' && !!chief.config.ignoreExportsUsedInFile[exportedItem.type]
        : chief.config.ignoreExportsUsedInFile)
    );
  };

  if (isReportValues || isReportTypes) {
    streamer.cast('Analyzing source files...');

    for (const [filePath, exportItems] of Object.entries(exportedSymbols)) {
      const workspace = chief.findWorkspaceByFilePath(filePath);

      if (workspace) {
        const { isIncludeEntryExports } = workspace.config;

        // Bail out when in entry file (unless `isIncludeEntryExports`)
        if (!isIncludeEntryExports && entryPaths.has(filePath)) continue;

        const importsForExport = importedSymbols[filePath];

        for (const [identifier, exportedItem] of Object.entries(exportItems)) {
          // Skip exports tagged `@public` or `@beta`
          if (exportedItem.jsDocTags.includes('@public') || exportedItem.jsDocTags.includes('@beta')) continue;

          // Skip exports tagged `@alias`
          if (exportedItem.jsDocTags.includes('@alias')) continue;

          // Skip exports tagged `@internal` in --production mode
          if (isProduction && exportedItem.jsDocTags.includes('@internal')) continue;

          if (importsForExport && isIdentifierImported(filePath, identifier, importsForExport)) {
            // Skip members of classes/enums that are eventually re-exported by entry files (unless `isIncludeEntryExports`)
            if (!isIncludeEntryExports && importsForExport.isReExport && isExportedInEntryFile(importsForExport)) {
              continue;
            }

            if (exportedItem.type === 'enum') {
              exportedItem.members?.forEach(member => {
                if (
                  member.refs === 0 &&
                  !isIdentifierImported(filePath, `${identifier}.${member.identifier}`, importsForExport)
                ) {
                  collector.addIssue({
                    type: 'enumMembers',
                    filePath,
                    symbol: member.identifier,
                    parentSymbol: identifier,
                    pos: exportedItem.pos,
                    line: exportedItem.line,
                    col: exportedItem.col,
                  });
                }
              });
            }

            // This id was imported, so we bail out early
            continue;
          }

          const hasNsImport = Boolean(importsForExport?.hasStar);

          if (!isIncludeEntryExports && getReExportingEntryFile(importsForExport, identifier)) continue;

          const isType = ['enum', 'type', 'interface'].includes(exportedItem.type);

          if (hasNsImport && ((!report.nsTypes && isType) || (!report.nsExports && !isType))) continue;

          if (!isExportedItemReferenced(exportedItem)) {
            const type = isType ? (hasNsImport ? 'nsTypes' : 'types') : hasNsImport ? 'nsExports' : 'exports';
            collector.addIssue({
              type,
              filePath,
              symbol: identifier,
              symbolType: exportedItem.type,
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
    dependencyIssues.forEach(issue => collector.addIssue(issue));
    if (!isProduction) devDependencyIssues.forEach(issue => collector.addIssue(issue));
    optionalPeerDependencyIssues.forEach(issue => collector.addIssue(issue));
    configurationHints.forEach(hint => collector.addConfigurationHint(hint));
  }

  const unusedIgnoredWorkspaces = chief.getUnusedIgnoredWorkspaces();
  unusedIgnoredWorkspaces.forEach(identifier =>
    collector.addConfigurationHint({ type: 'ignoreWorkspaces', identifier })
  );

  const { issues, counters, configurationHints } = collector.getIssues();

  if (isFix) {
    await fixer.fixIssues(issues);
  }

  streamer.clear();

  return { report, issues, counters, rules, configurationHints };
};
