import micromatch from 'micromatch';
import { _getDependenciesFromScripts } from './binaries/index.js';
import { fromBinary, isBinary } from './binaries/util.js';
import { ConfigurationChief, Workspace } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { IssueCollector } from './IssueCollector.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import { ProjectPrincipal } from './ProjectPrincipal.js';
import { ExportItem, Exports } from './types/exports.js';
import { ImportedModule, Imports } from './types/imports.js';
import { compact } from './util/array.js';
import { debugLogObject, debugLogArray, debugLog } from './util/debug.js';
import { LoaderError } from './util/errors.js';
import { findFile } from './util/fs.js';
import { _glob } from './util/glob.js';
import {
  getEntryPathFromManifest,
  getPackageNameFromFilePath,
  getPackageNameFromModuleSpecifier,
} from './util/modules.js';
import { dirname, isInNodeModules, join, isInternal, toAbsolute } from './util/path.js';
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
  const { cwd, tsConfigFile, gitignore, isStrict, isProduction, isShowProgress, isIncludeEntryExports } =
    unresolvedConfiguration;

  debugLogObject('Unresolved configuration (from CLI arguments)', unresolvedConfiguration);

  const chief = new ConfigurationChief({ cwd, isProduction });
  const deputy = new DependencyDeputy({ isStrict });
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer({ isEnabled: isShowProgress });

  streamer.cast('Reading workspace configuration(s)...');

  await chief.init();

  const compilers = chief.getCompilers();
  const workspaces = chief.getEnabledWorkspaces();
  const report = chief.getIssueTypesToReport();
  const rules = chief.getRules();

  const isReportDependencies = report.dependencies || report.unlisted || report.unresolved;
  const isReportValues = report.exports || report.nsExports || report.classMembers;
  const isReportTypes = report.types || report.nsTypes || report.enumMembers;

  const collector = new IssueCollector({ cwd, rules });

  const enabledPluginsStore: Map<string, string[]> = new Map();

  // TODO Organize better
  deputy.addIgnored(chief.config.ignoreBinaries, chief.config.ignoreDependencies);

  debugLogObject('Included workspaces', workspaces);

  const handleReferencedDependency = ({
    specifier,
    containingFilePath,
    principal,
    workspace,
  }: HandleReferencedDependencyOptions) => {
    if (isInternal(specifier)) {
      // Pattern: ./module.js, /abs/path/to/module.js, /abs/path/to/module/index.js
      const absSpecifier = toAbsolute(specifier, dirname(containingFilePath));
      const filePath = _tryResolve(absSpecifier, containingFilePath);
      if (filePath) {
        const ignorePatterns = workspace.config.ignore.map(pattern => join(dirname(containingFilePath), pattern));
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

        // Patterns: @local/package/file, self-reference/file
        if (packageName && specifier !== packageName) {
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

    const principal = factory.getPrincipal({ cwd: dir, paths, compilerOptions, compilers });

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

    const entryPathsFromManifest = await getEntryPathFromManifest(cwd, dir, manifest);
    debugLogArray(`Found entry paths from manifest (${name})`, entryPathsFromManifest);
    principal.addEntryPaths(entryPathsFromManifest);

    if (isProduction) {
      {
        const patterns = worker.getProductionEntryFilePatterns();
        const workspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found entry paths (${name})`, workspaceEntryPaths);
        principal.addEntryPaths(workspaceEntryPaths);
      }

      {
        const patterns = worker.getProductionPluginEntryFilePatterns();
        const pluginWorkspaceEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found production plugin entry paths (${name})`, pluginWorkspaceEntryPaths);
        principal.addEntryPaths(pluginWorkspaceEntryPaths);
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
      }

      {
        const patterns = worker.getPluginProjectFilePatterns();
        const pluginWorkspaceProjectPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found plugin project paths (${name})`, pluginWorkspaceProjectPaths);
        pluginWorkspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
      }

      {
        const patterns = compact(worker.getPluginConfigPatterns());
        const configurationEntryPaths = await _glob({ ...sharedGlobOptions, patterns });
        debugLogArray(`Found plugin configuration paths (${name})`, configurationEntryPaths);
        principal.addEntryPaths(configurationEntryPaths);
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
      const workspace = chief.findWorkspaceByFilePath(filePath);
      if (workspace) {
        const { imports, exports, scripts } = principal.analyzeSourceFile(filePath, { skipTypeOnly: !isReportTypes });
        const { internal, external, unresolved } = imports;
        const { exported, duplicate } = exports;

        if (exported.size > 0) exportedSymbols.set(filePath, exported);

        for (const [specifierFilePath, importItems] of internal.entries()) {
          // Mark "external" imports from other local workspaces as used dependency
          const packageName = getPackageNameFromModuleSpecifier(importItems.specifier);
          if (packageName && chief.localWorkspaces.has(packageName)) external.add(packageName);

          if (!importedSymbols.has(specifierFilePath)) {
            importedSymbols.set(specifierFilePath, importItems);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const importedModule = importedSymbols.get(specifierFilePath)!;
            for (const identifier of importItems.symbols) {
              importedModule.symbols.add(identifier);
            }
            if (importItems.isReExport) {
              importedModule.isReExport = importItems.isReExport;
              importedModule.isReExportedBy.add(filePath);
            }
            if (importItems.isDynamic) importedModule.isDynamic = importItems.isDynamic;
            if (importItems.isStar) importedModule.isStar = importItems.isStar;
          }
        }

        duplicate.forEach(symbols => {
          const symbol = symbols.join('|');
          collector.addIssue({ type: 'duplicates', filePath, symbol, symbols });
        });

        external.forEach(specifier => {
          const packageName = getPackageNameFromModuleSpecifier(specifier);
          const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
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

    collector.addFileCounts({ processed: analyzedFiles.size, unused: unusedFiles.length });

    const isExportedInEntryFile = (importedModule?: ImportedModule): boolean => {
      if (!importedModule) return false;
      const { isReExport, isReExportedBy } = importedModule;
      const { entryPaths } = principal;
      const hasFile = (file: string) => entryPaths.has(file) || isExportedInEntryFile(importedSymbols.get(file));
      return isReExport ? Array.from(isReExportedBy).some(hasFile) : false;
    };

    const isExportedItemReferenced = (exportedItem: ExportItem, filePath: string) => {
      const hasReferences = principal.getHasReferences(filePath, exportedItem);
      return (
        hasReferences.external ||
        (hasReferences.internal &&
          (typeof chief.config.ignoreExportsUsedInFile === 'object'
            ? exportedItem.type !== 'unknown' && !!chief.config.ignoreExportsUsedInFile[exportedItem.type]
            : chief.config.ignoreExportsUsedInFile))
      );
    };

    if (isReportValues || isReportTypes) {
      streamer.cast('Analyzing source files...');

      for (const [filePath, exportItems] of exportedSymbols.entries()) {
        // Bail out when in entry file (unless --include-entry-exports)
        if (!isIncludeEntryExports && principal.entryPaths.has(filePath)) continue;

        const importedModule = importedSymbols.get(filePath);

        for (const [symbol, exportedItem] of exportItems.entries()) {
          // Skip exports with a JSDoc `@public` tag
          if (principal.isPublicExport(exportedItem)) continue;

          if (importedModule?.symbols.has(symbol)) {
            // Skip members of classes/enums that are eventually exported by entry files
            if (importedModule.isReExport && isExportedInEntryFile(importedModule)) continue;

            if (report.enumMembers && exportedItem.type === 'enum' && exportedItem.members) {
              if (isProduction) continue;
              principal.findUnusedMembers(filePath, exportedItem.members).forEach(member => {
                collector.addIssue({ type: 'enumMembers', filePath, symbol: member, parentSymbol: symbol });
              });
            }

            if (report.classMembers && exportedItem.type === 'class' && exportedItem.members) {
              principal.findUnusedMembers(filePath, exportedItem.members).forEach(member => {
                collector.addIssue({ type: 'classMembers', filePath, symbol: member, parentSymbol: symbol });
              });
            }

            // This symbol was imported, so we bail out early
            continue;
          }

          const isStar = Boolean(importedModule?.isStar);
          const isReExportedByEntryFile = isStar && isExportedInEntryFile(importedModule);

          if (!isReExportedByEntryFile && !isExportedItemReferenced(exportedItem, filePath)) {
            if (['enum', 'type', 'interface'].includes(exportedItem.type)) {
              if (isProduction) continue;
              const type = isStar ? 'nsTypes' : 'types';
              collector.addIssue({ type, filePath, symbol, symbolType: exportedItem.type });
            } else {
              const type = isStar ? 'nsExports' : 'exports';
              collector.addIssue({ type, filePath, symbol });
            }
          }
        }
      }
    }
  }

  if (isReportDependencies) {
    const { dependencyIssues, devDependencyIssues } = deputy.settleDependencyIssues();
    const { configurationHints } = deputy.getConfigurationHints();
    dependencyIssues.forEach(issue => collector.addIssue(issue));
    if (!isProduction) devDependencyIssues.forEach(issue => collector.addIssue(issue));
    configurationHints.forEach(hint => collector.addConfigurationHint(hint));
  }

  const unusedIgnoredWorkspaces = chief.getUnusedIgnoredWorkspaces();
  unusedIgnoredWorkspaces.forEach(identifier =>
    collector.addConfigurationHint({ type: 'ignoreWorkspaces', identifier })
  );

  const { issues, counters, configurationHints } = collector.getIssues();

  streamer.clear();

  return { report, issues, counters, rules, configurationHints };
};
