import path from 'node:path';
import ts from 'typescript';
import { resolveConfig, resolveIncludedIssueGroups } from './util/config';
import { findFile } from './util/fs';
import { resolvePaths } from './util/path';
import { createProject } from './util/project';
import { findIssues } from './runner';
import { ConfigurationError } from './util/errors';
import type { UnresolvedConfiguration, Configuration } from './types';

export const main = async (options: UnresolvedConfiguration) => {
  const {
    cwd,
    workingDir,
    configFilePath = 'knip.json',
    tsConfigFilePath,
    include,
    exclude,
    ignore,
    gitignore,
    isDev,
    isShowProgress,
    jsDoc,
  } = options;

  const localConfigurationPath = configFilePath && (await findFile(workingDir, configFilePath));
  const manifestPath = await findFile(workingDir, 'package.json');
  const localConfiguration = localConfigurationPath && require(localConfigurationPath);
  const manifest = manifestPath && require(manifestPath);

  if (!localConfigurationPath && !manifest.knip) {
    const location = workingDir === cwd ? 'current directory' : `${path.relative(cwd, workingDir)} or up.`;
    throw new ConfigurationError(`Unable to find ${configFilePath} or package.json#knip in ${location}`);
  }

  const dir = path.relative(cwd, workingDir);
  const resolvedConfig = resolveConfig(manifest.knip ?? localConfiguration, { workingDir: dir, isDev });

  if (!resolvedConfig) {
    throw new ConfigurationError('Unable to find `entryFiles` and/or `projectFiles` in configuration.');
  }

  const report = resolveIncludedIssueGroups(include, exclude, resolvedConfig);

  let tsConfigPaths: string[] = [];
  const tsConfigPath = await findFile(workingDir, tsConfigFilePath ?? 'tsconfig.json');
  if (tsConfigFilePath && !tsConfigPath) {
    throw new ConfigurationError(`Unable to find ${tsConfigFilePath}`);
  }

  if (tsConfigPath) {
    const tsConfig = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
    tsConfigPaths = tsConfig.config.compilerOptions?.paths
      ? Object.keys(tsConfig.config.compilerOptions.paths).map(p => p.replace(/\*/g, '**'))
      : [];

    if (tsConfig.error) {
      throw new ConfigurationError(`An error occured when reading ${path.relative(cwd, tsConfigPath)}`);
    }
  }

  const projectOptions = tsConfigPath ? { tsConfigFilePath: tsConfigPath } : { compilerOptions: { allowJs: true } };

  // Create workspace for entry files + resolved dependencies
  const entryPaths = await resolvePaths({
    cwd,
    workingDir,
    patterns: resolvedConfig.entryFiles,
    ignore,
    gitignore,
  });
  const production = createProject({ projectOptions, paths: entryPaths });
  const entryFiles = production.getSourceFiles();
  production.resolveSourceFileDependencies();
  const productionFiles = production.getSourceFiles();

  // Create workspace for the entire project
  const projectPaths = await resolvePaths({
    cwd,
    workingDir,
    patterns: resolvedConfig.projectFiles,
    ignore,
    gitignore,
  });
  const project = createProject({ projectOptions, paths: projectPaths });
  const projectFiles = project.getSourceFiles();

  const config: Configuration = {
    workingDir,
    report,
    entryFiles,
    productionFiles,
    projectFiles,
    dependencies: Object.keys(manifest.dependencies ?? {}),
    devDependencies: Object.keys(manifest.devDependencies ?? {}),
    isDev: typeof resolvedConfig.dev === 'boolean' ? resolvedConfig.dev : isDev,
    tsConfigPaths,
    isShowProgress,
    jsDocOptions: {
      isReadPublicTag: jsDoc.includes('public'),
    },
  };

  const { issues, counters } = await findIssues(config);

  return { report, issues, counters };
};
