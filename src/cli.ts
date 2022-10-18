#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';
import { main } from '.';
import { printHelp } from './help';
import reporters from './reporters';
import { ConfigurationError } from './util/errors';
import type { IssueGroup } from './types';

const {
  values: {
    help,
    dir,
    config: configFilePath,
    tsConfig: tsConfigFilePath,
    include = [],
    exclude = [],
    ignore = [],
    'no-gitignore': isNoGitIgnore = false,
    dev: isDev = false,
    'include-entry-files': isIncludeEntryFiles = false,
    'no-progress': noProgress = false,
    reporter = 'symbols',
    'reporter-options': reporterOptions = '',
    'max-issues': maxIssues = '0',
    jsdoc: jsDoc = [],
    debug: isDebug = false,
    'debug-level': debugLevel = '1',
  },
} = parseArgs({
  options: {
    help: { type: 'boolean' },
    config: { type: 'string', short: 'c' },
    tsConfig: { type: 'string', short: 't' },
    dir: { type: 'string' },
    include: { type: 'string', multiple: true },
    exclude: { type: 'string', multiple: true },
    ignore: { type: 'string', multiple: true },
    'no-gitignore': { type: 'boolean' },
    dev: { type: 'boolean' },
    'include-entry-files': { type: 'boolean' },
    'no-progress': { type: 'boolean' },
    'max-issues': { type: 'string' },
    reporter: { type: 'string' },
    'reporter-options': { type: 'string' },
    jsdoc: { type: 'string', multiple: true },
    debug: { type: 'boolean' },
    'debug-level': { type: 'string' },
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

const run = async () => {
  try {
    const { report, issues, counters } = await main({
      cwd,
      workingDir,
      configFilePath,
      tsConfigFilePath,
      include,
      exclude,
      ignore,
      gitignore: !isNoGitIgnore,
      isIncludeEntryFiles,
      isDev,
      isShowProgress,
      jsDoc,
      debug: {
        isEnabled: isDebug,
        level: isDebug ? Number(debugLevel) : 0,
      },
    });

    printReport({ report, issues, cwd, workingDir, isDev, options: reporterOptions });
    const totalErrorCount = (Object.keys(report) as IssueGroup[])
      .filter((reportGroup) => report[reportGroup])
      .map(reportGroup => reportGroup === 'unlisted' ? 'unresolved' : reportGroup)
      .reduce((errorCount: number, reportGroup) => errorCount + counters[reportGroup], 0);

    if (totalErrorCount > Number(maxIssues)) process.exit(totalErrorCount);
  } catch (error: unknown) {
    if (error instanceof ConfigurationError) {
      console.error(error.message + '\n');
      printHelp();
      process.exit(1);
    }
    // We should never arrive here, but also not swallow silently
    throw error;
  }
};

run();
