import ts from 'typescript';
import { resolveConfig, resolveIncludedIssueTypes } from './util/config.js';
import { findFile, loadJSON } from './util/fs.js';
import { relative } from './util/path.js';
import { _glob } from './util/glob.js';
import { _createProject, _resolveSourceFileDependencies, _removeExternalSourceFiles } from './util/project.js';
import { findIssues } from './runner.js';
import { ConfigurationError } from './util/errors.js';
import { debugLogObject, debugLogFiles, debugLogSourceFiles } from './util/debug.js';
import { getMessageUpdater } from './progress.js';
import type { UnresolvedConfiguration, Configuration } from './types.js';

export const main = async (unresolvedConfiguration: UnresolvedConfiguration) => {
  const {
    cwd,
    workingDir,
    configFilePath: configFilePathArg,
    tsConfigFilePath: tsConfigFilePathArg,
    include,
    exclude,
    ignore,
    gitignore,
    isIncludeEntryFiles,
    isDev,
    isShowProgress,
    debug,
  } = unresolvedConfiguration;

  const updateMessage = getMessageUpdater(unresolvedConfiguration);

  debugLogObject(debug, 1, 'Unresolved configuration', unresolvedConfiguration);

  updateMessage('Reading configuration and manifest files...');

  const manifestPath = await findFile(cwd, workingDir, 'package.json');
  const manifest = manifestPath && (await loadJSON(manifestPath));

  if (!manifestPath || !manifest) {
    throw new ConfigurationError('Unable to find package.json');
  }

  const configFilePath = configFilePathArg ?? 'knip.json';
  const resolvedConfigFilePath = await findFile(cwd, workingDir, configFilePath);
  const localConfig = resolvedConfigFilePath && (await loadJSON(resolvedConfigFilePath));
  if (configFilePathArg && !resolvedConfigFilePath) {
    throw new ConfigurationError(`Unable to find ${configFilePathArg}`);
  }

  const tsConfigFilePath = tsConfigFilePathArg ?? 'tsconfig.json';
  const resolvedTsConfigFilePath = await findFile(cwd, workingDir, tsConfigFilePath);
  if (tsConfigFilePathArg && !resolvedTsConfigFilePath) {
    throw new ConfigurationError(`Unable to find ${tsConfigFilePathArg}`);
  }

  let tsConfigPathGlobs: string[] = [];
  if (resolvedTsConfigFilePath) {
    const config = ts.readConfigFile(resolvedTsConfigFilePath, ts.sys.readFile);
    tsConfigPathGlobs = config.config.compilerOptions?.paths
      ? Object.keys(config.config.compilerOptions.paths).map(p => p.replace(/\*/g, '**')) // TODO Replacement too naive?
      : [];
    if (config.error) {
      throw new ConfigurationError(`Unable to read ${relative(resolvedTsConfigFilePath)}`);
    }
  }

  const dir = relative(workingDir);
  const resolvedConfig = resolveConfig(manifest.knip ?? localConfig, { workingDir: dir, isDev });

  debugLogObject(debug, 1, 'Resolved configuration', resolvedConfig);

  if (!resolvedConfigFilePath && !manifest.knip && !resolvedTsConfigFilePath) {
    throw new ConfigurationError(`Unable to find ${configFilePath} or package.json#knip or ${tsConfigFilePath}`);
  }

  const { entryFiles, productionFiles, projectFiles } = await (async () => {
    if (resolvedConfig) {
      const skipAddFiles = { skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true };
      const projectOptions = resolvedTsConfigFilePath
        ? { tsConfigFilePath: resolvedTsConfigFilePath }
        : { compilerOptions: { allowJs: true } };

      updateMessage('Resolving entry files...');
      const entryPaths = await _glob({
        cwd,
        workingDir,
        patterns: resolvedConfig.entryFiles,
        ignore,
        gitignore,
      });
      debugLogFiles(debug, 1, 'Globbed entry paths', entryPaths);

      // Create workspace for entry files, but don't resolve dependencies yet
      const production = _createProject({ ...projectOptions, ...skipAddFiles }, entryPaths);
      const entryFiles = production.getSourceFiles();
      debugLogSourceFiles(debug, 1, 'Resolved entry source files', entryFiles);

      // Now resolve dependencies of entry files to find all production files
      _resolveSourceFileDependencies(production);
      const productionFiles = _removeExternalSourceFiles(production);
      debugLogSourceFiles(debug, 1, 'Resolved production source files', productionFiles);

      updateMessage('Resolving project files...');
      const projectPaths = await _glob({
        cwd,
        workingDir,
        patterns: resolvedConfig.projectFiles,
        ignore,
        gitignore,
      });
      debugLogFiles(debug, 1, 'Globbed project paths', projectPaths);

      // Create workspace for the entire project
      const project = _createProject({ ...projectOptions, ...skipAddFiles }, projectPaths);
      const projectFiles = project.getSourceFiles();
      debugLogSourceFiles(debug, 1, 'Resolved project source files', projectFiles);

      return { entryFiles, productionFiles, projectFiles };
    } else {
      updateMessage('Resolving project files...');
      // Zero-config resolution, just pass the TS config to ts-morph
      const project = _createProject({ tsConfigFilePath: resolvedTsConfigFilePath });
      const files = project.getSourceFiles();
      return { entryFiles: files, productionFiles: files, projectFiles: files };
    }
  })();

  // No (need to report) unused files in zero-config mode
  const report = resolveIncludedIssueTypes(include, resolvedConfig ? exclude : ['files'], resolvedConfig);

  const config: Configuration = {
    workingDir,
    report,
    entryFiles,
    productionFiles,
    projectFiles,
    isIncludeEntryFiles: !resolvedConfig || isIncludeEntryFiles,
    manifestPath,
    dependencies: Object.keys(manifest.dependencies ?? {}),
    peerDependencies: Object.keys(manifest.peerDependencies ?? {}),
    optionalDependencies: Object.keys(manifest.optionalDependencies ?? {}),
    devDependencies: Object.keys(manifest.devDependencies ?? {}),
    isDev: Boolean(resolvedConfig?.dev),
    tsConfigPathGlobs: tsConfigPathGlobs,
    isShowProgress,
    debug,
  };

  const { issues, counters } = await findIssues(config);

  debugLogObject(debug, 2, 'Issues', issues);

  return { report, issues, counters };
};
