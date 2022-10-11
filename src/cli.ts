#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { printHelp } from './help';
import { resolveConfig, resolveIncludedIssueGroups } from './util/config';
import { findFile } from './util/path';
import reporters from './reporters';
import { run } from '.';
import type { Configuration, IssueGroup } from './types';

const {
  values: {
    help,
    dir,
    config: configFilePath = 'knip.json',
    tsConfig: tsConfigFilePath,
    include = [],
    exclude = [],
    dev: isDev = false,
    'no-progress': noProgress = false,
    reporter = 'symbols',
    jsdoc = [],
    'max-issues': maxIssues = '0',
  },
} = parseArgs({
  options: {
    help: { type: 'boolean' },
    config: { type: 'string', short: 'c' },
    tsConfig: { type: 'string', short: 't' },
    dir: { type: 'string' },
    include: { type: 'string', multiple: true },
    exclude: { type: 'string', multiple: true },
    dev: { type: 'boolean' },
    'max-issues': { type: 'string' },
    'no-progress': { type: 'boolean' },
    reporter: { type: 'string' },
    jsdoc: { type: 'string', multiple: true },
  },
});

if (help) {
  printHelp();
  process.exit(0);
}

const cwd = process.cwd();
const workingDir = dir ? path.resolve(dir) : cwd;

const isShowProgress =
  noProgress === false ? process.stdout.isTTY && typeof process.stdout.cursorTo === 'function' : !noProgress;

const printReport =
  reporter in reporters ? reporters[reporter as keyof typeof reporters] : require(path.join(workingDir, reporter));

const main = async () => {
  const localConfigurationPath = await findFile(workingDir, configFilePath);
  const manifestPath = await findFile(workingDir, 'package.json');
  const localConfiguration = localConfigurationPath && require(localConfigurationPath);
  const manifest = manifestPath && require(manifestPath);

  if (!localConfigurationPath && !manifest.knip) {
    const location = workingDir === cwd ? 'current directory' : `${path.relative(cwd, workingDir)} or up.`;
    console.error(`Unable to find ${configFilePath} or package.json#knip in ${location}\n`);
    printHelp();
    process.exit(1);
  }

  const resolvedConfig = resolveConfig(manifest.knip ?? localConfiguration, { workingDir: dir, isDev });

  if (!resolvedConfig) {
    printHelp();
    process.exit(1);
  }

  const report = resolveIncludedIssueGroups(include, exclude, resolvedConfig);

  let tsConfigPaths: string[] = [];
  const tsConfigPath = await findFile(workingDir, tsConfigFilePath ?? 'tsconfig.json');
  if (tsConfigFilePath && !tsConfigPath) {
    console.error(`Unable to find ${tsConfigFilePath}\n`);
    printHelp();
    process.exit(1);
  }

  if (tsConfigPath) {
    const tsConfig = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
    tsConfigPaths = tsConfig.config.compilerOptions?.paths
      ? Object.keys(tsConfig.config.compilerOptions.paths).map(p => p.replace(/\*/g, '**'))
      : [];

    if (tsConfig.error) {
      console.error(`An error occured when reading ${path.relative(cwd, tsConfigPath)}.\n`);
      printHelp();
      process.exit(1);
    }
  }

  const config: Configuration = {
    workingDir,
    report,
    dependencies: Object.keys(manifest.dependencies ?? {}),
    devDependencies: Object.keys(manifest.devDependencies ?? {}),
    isDev: typeof resolvedConfig.dev === 'boolean' ? resolvedConfig.dev : isDev,
    tsConfigFilePath,
    tsConfigPaths,
    isShowProgress,
    jsDocOptions: {
      isReadPublicTag: jsdoc.includes('public'),
    },
    ...resolvedConfig,
  };

  const { issues, counters } = await run(config);

  printReport({ issues, workingDir, config });

  const reportGroup = report.files ? 'files' : (Object.keys(report) as IssueGroup[]).find(key => report[key]);
  const counterGroup = reportGroup === 'unlisted' ? 'unresolved' : reportGroup;
  if (counterGroup) {
    const count = counters[counterGroup];
    if (count > Number(maxIssues)) process.exit(count);
  }
};

main();
