import path from 'node:path';
import ConfigurationChief from './configuration-chief.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import DependencyDeputy from './dependency-deputy.js';
import IssueCollector from './issue-collector.js';
import ProjectPrincipal from './project-principal.js';
import SourceLab from './source-lab.js';
import { compact } from './util/array.js';
import { debugLogObject, debugLogFiles } from './util/debug.js';
import { _findImportModuleSpecifiers } from './util/find-import-specifiers.js';
import { findFile, loadJSON } from './util/fs.js';
import { _glob, ensurePosixPath } from './util/glob.js';
import { _findDuplicateExportedNames } from './util/project.js';
import { loadTSConfig } from './util/tsconfig-loader.js';
import { byPathDepth } from './util/workspace.js';
import WorkspaceWorker from './workspace-worker.js';
import type { CommandLineOptions } from './types/cli.js';
import type { Report } from './types/issues.js';
import type { SourceFile } from 'ts-morph';

export const main = async (unresolvedConfiguration: CommandLineOptions) => {
  const { cwd, tsConfigFile, gitignore, isStrict, isProduction, isShowProgress, isIncludeEntryExports } =
    unresolvedConfiguration;

  const chief = new ConfigurationChief({ cwd, isProduction });

  debugLogObject('Unresolved configuration', unresolvedConfiguration);

  const collector = new IssueCollector({ cwd, isShowProgress });
  collector.updateMessage('Reading configuration and manifest files...');

  await chief.loadLocalConfig();

  const deputy = new DependencyDeputy({ isStrict, ignoreDependencies: chief.config.ignoreDependencies });

  const workspaces = await chief.getActiveWorkspaces();

  debugLogObject('Included workspaces', workspaces);

  const report = chief.resolveIncludedIssueTypes();

  // Order matters: the root workspace should go first, and then its children, etc.
  const workspaceDirs = Object.values(workspaces)
    .map(workspace => workspace.dir)
    .sort(byPathDepth)
    .reverse();

  const lab = new SourceLab({ report, workspaceDirs, isIncludeEntryExports });

  const principal = new ProjectPrincipal();

  for (const { name, dir, config, ancestors } of workspaces) {
    const isRoot = name === ROOT_WORKSPACE_NAME;

    const suffix = isRoot ? '' : ` (${name})`;

    const manifestPath = isRoot ? chief.manifestPath : await findFile(dir, 'package.json');
    const manifest = isRoot ? chief.manifest : manifestPath && (await loadJSON(manifestPath));

    if (!manifestPath || !manifest) continue;

    deputy.addWorkspace({ name, dir, manifestPath, manifest });

    const tsConfigFilePath = path.join(dir, tsConfigFile ?? 'tsconfig.json');
    const tsConfig = await loadTSConfig(tsConfigFilePath);

    if (isRoot && tsConfig) {
      principal.tsConfigFilePath = tsConfigFilePath;
    }

    if (tsConfig?.compilerOptions?.paths) {
      deputy.addTypeScriptConfigPathGlobs(name, tsConfig.compilerOptions.paths);
      principal.addTypeScriptPaths(dir, tsConfig.compilerOptions);
    }

    collector.updateMessage(`Resolving custom dependencies...${suffix}`);

    const workspaceManifest = deputy.getWorkspaceManifest(name);

    if (!workspaceManifest) continue;

    const negatedWorkspacePatterns = await chief.getNegatedWorkspacePatterns(name);

    const worker = new WorkspaceWorker({
      name,
      dir,
      config,
      rootWorkspaceConfig: chief.getConfigForWorkspace(ROOT_WORKSPACE_NAME),
      manifest,
      ancestorManifests: ancestors.map(name => deputy.getManifest(name)),
      rootConfig: chief.config,
      negatedWorkspacePatterns,
      rootWorkspaceDir: cwd,
      isProduction,
    });

    await worker.init();

    // Add listed peer dependencies, as they're often not referenced anywhere, used to settle dependencies at the end
    deputy.addPeerDependencies(name, worker.peerDependencies);

    // Add installed binaries
    deputy.setInstalledBinaries(name, worker.installedBinaries);

    if (config?.entry && config?.project) {
      if (isProduction) {
        {
          collector.updateMessage(`Resolving entry files${suffix}...`);
          const workspaceEntryPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: worker.getProductionEntryFilePatterns(),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed entry paths${suffix}`, workspaceEntryPaths);
          workspaceEntryPaths.forEach(entryPath => principal.addEntryPath(entryPath));
          if (!isIncludeEntryExports) workspaceEntryPaths.forEach(entryPath => lab.skipExportsAnalysisFor(entryPath));
        }

        {
          collector.updateMessage(`Resolving production plugin entry files${suffix}...`);
          const pluginWorkspaceEntryPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: worker.getProductionPluginEntryFilePatterns(),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed production plugin entry paths${suffix}`, pluginWorkspaceEntryPaths);
          pluginWorkspaceEntryPaths.forEach(entryPath => principal.addEntryPath(entryPath));
          pluginWorkspaceEntryPaths.forEach(entryPath => lab.skipExportsAnalysisFor(entryPath));
        }

        {
          collector.updateMessage(`Resolving project files${suffix}...`);
          const workspaceProjectPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: worker.getProductionProjectFilePatterns(),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed project paths${suffix}`, workspaceProjectPaths);
          workspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
        }
      } else {
        {
          collector.updateMessage(`Resolving entry files${suffix}...`);

          const workspaceEntryPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: worker.getEntryFilePatterns(),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed entry paths${suffix}`, workspaceEntryPaths);
          workspaceEntryPaths.forEach(entryPath => principal.addEntryPath(entryPath));
          if (!isIncludeEntryExports) workspaceEntryPaths.forEach(entryPath => lab.skipExportsAnalysisFor(entryPath));
        }

        {
          collector.updateMessage(`Resolving project files${suffix}...`);

          const workspaceProjectPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: worker.getProjectFilePatterns(),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed project paths${suffix}`, workspaceProjectPaths);
          workspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
        }

        {
          collector.updateMessage(`Resolving plugin entry files${suffix}...`);

          const pluginWorkspaceEntryPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: worker.getPluginEntryFilePatterns(),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed plugin entry paths${suffix}`, pluginWorkspaceEntryPaths);
          pluginWorkspaceEntryPaths.forEach(entryPath => principal.addEntryPath(entryPath));
          pluginWorkspaceEntryPaths.forEach(entryPath => lab.skipExportsAnalysisFor(entryPath));
        }

        {
          collector.updateMessage(`Resolving plugin project files${suffix}...`);

          const pluginWorkspaceProjectPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: worker.getPluginProjectFilePatterns(),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed plugin project paths${suffix}`, pluginWorkspaceProjectPaths);
          pluginWorkspaceProjectPaths.forEach(projectPath => principal.addProjectPath(projectPath));
          pluginWorkspaceProjectPaths.forEach(entryPath => lab.skipExportsAnalysisFor(entryPath));
        }

        {
          collector.updateMessage(`Resolving plugin configuration files${suffix}...`);
          const configurationEntryPaths = await _glob({
            cwd,
            workingDir: dir,
            patterns: compact(worker.getPluginConfigPatterns()),
            ignore: worker.getWorkspaceIgnorePatterns(),
            gitignore,
          });
          debugLogFiles(`Globbed plugin configuration paths${suffix}`, configurationEntryPaths);

          configurationEntryPaths.forEach(entryPath => principal.addEntryPath(entryPath));
          configurationEntryPaths.forEach(entryPath => principal.addProjectPath(entryPath));
          configurationEntryPaths.forEach(entryPath => lab.skipExportsAnalysisFor(entryPath));
        }
      }

      if (report.dependencies || report.unlisted || report.files) {
        const { referencedDependencyIssues } = await worker.findDependenciesByPlugins();
        referencedDependencyIssues.forEach(issue => {
          const workspace = { name, dir, config, ancestors };
          const unlistedDependency = deputy.maybeAddListedReferencedDependency(workspace, issue.symbol);
          if (unlistedDependency) collector.addIssue(issue);
        });
      }
    }
  }

  collector.setReport(report);

  collector.updateMessage('Connecting the dots...');

  principal.createProjects();

  // Finding import module specifiers isn't cheap, so let's cache them
  const moduleSpecifierCache: WeakMap<SourceFile, [string[], string[]]> = new WeakMap();

  // 1) First pass: let ts-morph resolve used files from entry files (initial dependency graph)
  const resolvedFiles = principal.getResolvedFiles();
  collector.setTotalFileCount(resolvedFiles.length);

  // 2) Second pass: add internal source files that ts-morph didn't resolve (referenced through dynamic `import`, `require` and `require.resolve`)
  resolvedFiles.forEach(sourceFile => {
    const moduleSpecifiers = _findImportModuleSpecifiers(sourceFile, { skipInternal: false, isStrict });
    moduleSpecifierCache.set(sourceFile, moduleSpecifiers);
    const [internalModuleSpecifiers] = moduleSpecifiers;
    internalModuleSpecifiers.forEach(resolvedFilePath => {
      principal.addSourceFile(resolvedFilePath);
    });
  });

  // 3) Third pass: final settlement of (un)used production files
  const { usedResolvedFiles, unreferencedResolvedFiles } = principal.settleFiles();

  collector.addFilesIssues(unreferencedResolvedFiles);

  collector.setTotalFileCount(usedResolvedFiles.size + unreferencedResolvedFiles.size);

  usedResolvedFiles.forEach(sourceFile => {
    collector.counters.processed++;
    const filePath = sourceFile.getFilePath();

    if (report.dependencies || report.unlisted) {
      const filePath = sourceFile.getFilePath();
      const workspaceDir = workspaceDirs.find(workspaceDir => filePath.startsWith(ensurePosixPath(workspaceDir)));
      const workspace = workspaces.find(workspace => workspace.dir === workspaceDir);
      if (workspace) {
        const [, externalModuleSpecifiers] =
          moduleSpecifierCache.get(sourceFile) ??
          _findImportModuleSpecifiers(sourceFile, { skipInternal: true, isStrict });
        externalModuleSpecifiers.forEach(moduleSpecifier => {
          const unlistedDependency = deputy.maybeAddListedReferencedDependency(workspace, moduleSpecifier);
          if (unlistedDependency) collector.addIssue({ type: 'unlisted', filePath, symbol: unlistedDependency });
        });
      }
    }

    if (report.duplicates) {
      const duplicateExports = _findDuplicateExportedNames(sourceFile);
      duplicateExports.forEach(symbols => {
        const symbol = symbols.join('|');
        collector.addIssue({ type: 'duplicates', filePath, symbol, symbols });
      });
    }

    const issues = lab.analyzeSourceFile(sourceFile);

    issues.forEach(issue => issue.type && collector.addIssue(issue));
  });

  if (report.dependencies) {
    const { dependencyIssues, devDependencyIssues } = deputy.settleDependencyIssues();
    dependencyIssues.forEach(issue => collector.addIssue(issue));
    if (!isProduction) devDependencyIssues.forEach(issue => collector.addIssue(issue));
  }

  const { issues, counters } = collector.getIssues();

  collector.removeProgress();

  return { report: report as Report, issues, counters };
};
