import { _getDependenciesFromScripts } from './binaries/index.js';
import { ConfigurationChief, Workspace } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { IssueCollector } from './IssueCollector.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import { ProjectPrincipal } from './ProjectPrincipal.js';
import { Exports } from './types/exports.js';
import { ImportedModule, Imports } from './types/imports.js';
import { compact } from './util/array.js';
import { debugLogObject, debugLogArray, debugLog } from './util/debug.js';
import { LoaderError } from './util/errors.js';
import { findFile } from './util/fs.js';
import { _glob } from './util/glob.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from './util/modules.js';
import { dirname, isInNodeModules, join, isInternal, isAbsolute } from './util/path.js';
import { _resolveSpecifier, _tryResolve } from './util/require.js';
import { _require } from './util/require.js';
import { loadTSConfig as loadCompilerOptions } from './util/tsconfig-loader.js';
import { WorkspaceWorker } from './WorkspaceWorker.js';
import type { CommandLineOptions } from './types/cli.js';

type HandleReferencedDependencyOptions = {
  specifier: string;
  containingFilePath: string;
  principal: ProjectPrincipal;
  workspace: Workspace;
};

export type { RawConfiguration as KnipConfig } from './types/config.js';
export type { Reporter, ReporterOptions } from './types/issues.js';

export const main = async (unresolvedConfiguration: CommandLineOptions) => {
  const { cwd, tsConfigFile, gitignore, isStrict, isProduction, isShowProgress } = unresolvedConfiguration;

  debugLogObject('Unresolved configuration (from CLI arguments)', unresolvedConfiguration);

  const chief = new ConfigurationChief({ cwd, isProduction });
  const deputy = new DependencyDeputy({ isStrict });
  const factory = new PrincipalFactory();
  const collector = new IssueCollector({ cwd });
  const streamer = new ConsoleStreamer({ isEnabled: isShowProgress });

  streamer.cast('Reading workspace configuration(s)...');

  await chief.init();

  const compilers = chief.getCompilers();
  const workspaces = chief.getEnabledWorkspaces();
  const report = chief.getIssueTypesToReport();

  debugLogObject('Included workspaces', workspaces);

  const handleReferencedDependency = ({
    specifier,
    containingFilePath,
    principal,
    workspace,
  }: HandleReferencedDependencyOptions) => {
    if (isInternal(specifier)) {
      // Pattern: ./module.js, /abs/path/to/module.js, /abs/path/to/module/index.js
      const absSpecifier = isAbsolute(specifier) ? specifier : join(dirname(containingFilePath), specifier);
      const filePath = _tryResolve(absSpecifier, containingFilePath);
      if (filePath) {
        principal.addEntryPath(filePath);
      } else {
        collector.addIssue({ type: 'unresolved', filePath: containingFilePath, symbol: specifier });
      }
    } else {
      if (isInNodeModules(specifier)) {
        // Pattern: /abs/path/to/repo/node_modules/package/index.js
        const packageName = getPackageNameFromFilePath(specifier);
        const isHandled = deputy.maybeAddReferencedExternalDependency(workspace, packageName);
        if (!isHandled) collector.addIssue({ type: 'unlisted', filePath: containingFilePath, symbol: specifier });
      } else {
        // Patterns: package, @any/package, @local/package, self-reference
        const packageName = getPackageNameFromModuleSpecifier(specifier);
        const isHandled = deputy.maybeAddReferencedExternalDependency(workspace, packageName);
        if (!isHandled) collector.addIssue({ type: 'unlisted', filePath: containingFilePath, symbol: specifier });

        // Patterns: @local/package/file, self-reference/file
        if (specifier !== packageName) {
          const otherWorkspace = chief.findWorkspaceByPackageName(packageName);
          if (otherWorkspace) {
            const filePath = _resolveSpecifier(otherWorkspace.dir, specifier);
            if (filePath) {
              principal.addEntryPath(filePath);
            } else {
              collector.addIssue({ type: 'unresolved', filePath: containingFilePath, symbol: specifier });
            }
          }
        }
      }
    }
  };

  const enabledPluginsStore: Map<string, string[]> = new Map();

  for (const workspace of workspaces) {
    const { name, dir, config, ancestors } = workspace;
    const { paths, ignoreDependencies, ignoreBinaries } = config;

    const isRoot = name === ROOT_WORKSPACE_NAME;

    streamer.cast(`Analyzing workspace (${name})...`);

    const manifestPath = isRoot ? chief.manifestPath : findFile(dir, 'package.json');
    const manifest = isRoot ? chief.manifest : manifestPath && _require(manifestPath);

    if (!manifestPath || !manifest) throw new LoaderError(`Unable to load package.json for ${name}`);

    deputy.addWorkspace({ name, dir, manifestPath, manifest, ignoreDependencies, ignoreBinaries });

    const compilerOptions = await loadCompilerOptions(join(dir, tsConfigFile ?? 'tsconfig.json'));

    const principal = factory.getPrincipal({ cwd: dir, report: report, paths, compilerOptions, compilers });

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

    const sharedGlobOptions = { cwd, workingDir: dir, gitignore, ignore: worker.getIgnorePatterns() };

    if (isProduction) {
      {
        const patterns = worker.getProductionEntryFilePatterns();
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found entry paths (${name})`, workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
        principal.skipExportsAnalysisFor(workspaceEntryPaths);
      }

      {
        const patterns = worker.getProductionPluginEntryFilePatterns();
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found production plugin entry paths (${name})`, pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths);
        principal.skipExportsAnalysisFor(pluginWorkspaceEntryPaths);
      }

      {
        const patterns = worker.getProductionProjectFilePatterns();
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found project paths (${name})`, workspaceProjectPaths);
        workspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
      }
    } else {
      {
        const patterns = worker.getEntryFilePatterns();
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found entry paths (${name})`, workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
        principal.skipExportsAnalysisFor(workspaceEntryPaths);
      }

      {
        const patterns = worker.getProjectFilePatterns();
        const workspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found project paths (${name})`, workspaceProjectPaths);
        workspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
      }

      {
        const patterns = worker.getPluginEntryFilePatterns();
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found plugin entry paths (${name})`, pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths);
        principal.skipExportsAnalysisFor(pluginWorkspaceEntryPaths);
      }

      {
        const patterns = worker.getPluginProjectFilePatterns();
        const pluginWorkspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found plugin project paths (${name})`, pluginWorkspaceProjectPaths);
        pluginWorkspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
        principal.skipExportsAnalysisFor(pluginWorkspaceProjectPaths);
      }

      {
        const patterns = compact(worker.getPluginConfigPatterns());
        const configurationEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found plugin configuration paths (${name})`, configurationEntryPaths);
        principal.addEntryPaths(configurationEntryPaths);
        principal.skipExportsAnalysisFor(configurationEntryPaths);
      }
    }

    // Add knip.ts (might import dependencies)
    if (chief.resolvedConfigFilePath) principal.addEntryPath(chief.resolvedConfigFilePath);

    // Get peerDependencies, installed binaries, entry files gathered through all plugins, and hand over
    // A bit of an entangled hotchpotch, but it's all related, and efficient in terms of reading package.json once, etc.
    const dependencies = await worker.findAllDependencies();
    const { referencedDependencies, peerDependencies, installedBinaries, enabledPlugins } = dependencies;

    deputy.addPeerDependencies(name, peerDependencies);
    deputy.setInstalledBinaries(name, installedBinaries);
    enabledPluginsStore.set(name, enabledPlugins);

    referencedDependencies.forEach(([containingFilePath, specifier]) => {
      handleReferencedDependency({ specifier, containingFilePath, principal, workspace });
    });
  }

  const principals = factory.getPrincipals();

  debugLog(`Installed ${principals.length} principals for ${workspaces.length} workspaces`);

  for (const principal of principals) {
    const exportedSymbols: Exports = new Map();
    const importedSymbols: Imports = new Map();

    const analyzeSourceFile = (filePath: string) => {
      collector.counters.processed++;
      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (workspace) {
        const { imports, exports, scripts } = principal.analyzeSourceFile(filePath);
        const { internal, external, unresolved } = imports;
        const { exported, duplicate } = exports;

        if (exported.size > 0) exportedSymbols.set(filePath, exported);

        for (const [specifierFilePath, importItems] of internal.entries()) {
          const packageName = getPackageNameFromModuleSpecifier(importItems.specifier);
          const importedWorkspace = chief.findWorkspaceByPackageName(packageName);
          if (importedWorkspace) {
            // TODO Ideally this is handled in `principal.analyzeSourceFile`, but that's unaware of (other) workspaces
            if (importedWorkspace === workspace) {
              // Self-referencing imports are not part of the program (it sets `isExternalLibraryImport: true`). Here we
              // patch this up by adding such internal file paths explicitly.
              //
              // TODO Imports may refer to modules that are not part of the program, causing potential false positives?
              // A potential fix is to not add paths matching `ignore` config.
              principal.addEntryPath(specifierFilePath);
            } else {
              external.add(importItems.specifier);
            }
          }

          if (!importedSymbols.has(specifierFilePath)) {
            importedSymbols.set(specifierFilePath, importItems);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const importedModule = importedSymbols.get(specifierFilePath)!;
            for (const identifier of importItems.symbols) {
              importedModule.symbols.add(identifier);
            }
            if (importItems.isReExported) {
              importedModule.isReExported = importItems.isReExported;
              importedModule.isReExportedBy.add(filePath);
            }
          }
        }

        duplicate.forEach(symbols => {
          const symbol = symbols.join('|');
          collector.addIssue({ type: 'duplicates', filePath, symbol, symbols });
        });

        external.forEach(specifier => {
          const packageName = getPackageNameFromModuleSpecifier(specifier);
          const isHandled = deputy.maybeAddReferencedExternalDependency(workspace, packageName);
          if (!isHandled) collector.addIssue({ type: 'unlisted', filePath, symbol: specifier });
        });

        unresolved.forEach(moduleSpecifier => {
          collector.addIssue({ type: 'unresolved', filePath, symbol: moduleSpecifier });
        });

        _getDependenciesFromScripts(scripts, { cwd: dirname(filePath) }).forEach(specifier => {
          handleReferencedDependency({ specifier, containingFilePath: filePath, principal, workspace });
        });
      }
    };

    const isExportedInEntryFile = (importedModule?: ImportedModule): boolean => {
      if (!importedModule) return false;
      const { isReExported, isReExportedBy } = importedModule;
      const { entryPaths } = principal;
      const hasFile = (file: string) => entryPaths.has(file) || isExportedInEntryFile(importedSymbols.get(file));
      return isReExported ? Array.from(isReExportedBy).some(hasFile) : false;
    };

    streamer.cast('Running async compilers...');

    await principal.runAsyncCompilers();

    streamer.cast('Connecting the dots...');

    const analyzedFiles: Set<string> = new Set();
    let size = principal.entryPaths.size;
    let round = 0;

    do {
      size = principal.entryPaths.size;
      const resolvedFiles = principal.getUsedResolvedFiles();
      const files = resolvedFiles.filter(filePath => !analyzedFiles.has(filePath));

      debugLogArray(`Analyzing used resolved files [P${principals.indexOf(principal) + 1}/${++round}]`, files);
      files.forEach(filePath => {
        analyzeSourceFile(filePath);
        analyzedFiles.add(filePath);
      });
    } while (size !== principal.entryPaths.size);

    const unusedFiles = principal.getUnreferencedFiles();

    collector.addFilesIssues(unusedFiles);

    collector.addTotalFileCount(analyzedFiles.size + unusedFiles.length);

    streamer.cast('Analyzing source files...');

    for (const [filePath, exportItems] of exportedSymbols.entries()) {
      const importedModule = importedSymbols.get(filePath);

      if (importedModule) {
        for (const [symbol, exportedItem] of exportItems.entries()) {
          // Leave exports with a JSDoc `@public` tag alone
          if (principal.isPublicExport(exportedItem)) continue;

          if (importedModule.symbols.has(symbol)) {
            if (report.enumMembers && exportedItem.type === 'enum' && exportedItem.members) {
              principal.findUnusedMembers(filePath, exportedItem.members).forEach(member => {
                collector.addIssue({ type: 'enumMembers', filePath, symbol: member, parentSymbol: symbol });
              });
            }

            if (report.classMembers && exportedItem.type === 'class' && exportedItem.members) {
              principal.findUnusedMembers(filePath, exportedItem.members).forEach(member => {
                collector.addIssue({ type: 'classMembers', filePath, symbol: member, parentSymbol: symbol });
              });
            }

            continue;
          }

          if (importedModule.isReExported || importedModule.isStar) {
            const isReExportedByEntryFile = isExportedInEntryFile(importedModule);
            if (!isReExportedByEntryFile && !principal.hasExternalReferences(filePath, exportedItem)) {
              if (['enum', 'type', 'interface'].includes(exportedItem.type)) {
                collector.addIssue({ type: 'nsTypes', filePath, symbol, symbolType: exportedItem.type });
              } else {
                collector.addIssue({ type: 'nsExports', filePath, symbol });
              }
            }
          } else {
            if (['enum', 'type', 'interface'].includes(exportedItem.type)) {
              collector.addIssue({ type: 'types', filePath, symbol, symbolType: exportedItem.type });
            } else if (!importedModule.isDynamic || !principal.hasExternalReferences(filePath, exportedItem)) {
              collector.addIssue({ type: 'exports', filePath, symbol });
            }
          }
        }
      }
    }
  }

  if (report.dependencies) {
    const { dependencyIssues, devDependencyIssues } = deputy.settleDependencyIssues();
    dependencyIssues.forEach(issue => collector.addIssue(issue));
    if (!isProduction) devDependencyIssues.forEach(issue => collector.addIssue(issue));
  }

  const { issues, counters } = collector.getIssues();

  streamer.clear();

  return { report, issues, counters };
};
