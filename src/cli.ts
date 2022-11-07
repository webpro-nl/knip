#!/usr/bin/env node

import path from 'node:path';
import parsedArgs from './util/parseArgs.js';
import { main } from './index.js';
import { printHelp } from './help.js';
import reporters from './reporters/index.js';
import { ConfigurationError } from './util/errors.js';
import { measure } from './util/performance.js';
import load from './util/loader.js';
import type { IssueType } from './types.js';

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
    debug: isDebug = false,
    'debug-level': debugLevel = '1',
  },
} = parsedArgs;

if (help) {
  printHelp();
  process.exit(0);
}

const cwd = process.cwd();
const workingDir = dir ? path.resolve(dir) : cwd;

const isShowProgress =
  !isDebug && noProgress === false && process.stdout.isTTY && typeof process.stdout.cursorTo === 'function';

const printReport =
  reporter in reporters ? reporters[reporter as keyof typeof reporters] : await load(path.join(workingDir, reporter));

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
      debug: {
        isEnabled: isDebug,
        level: isDebug ? Number(debugLevel) : 0,
      },
    });

    await printReport({ report, issues, cwd, workingDir, isDev, options: reporterOptions });

    const totalErrorCount = (Object.keys(report) as IssueType[])
      .filter(reportGroup => report[reportGroup])
      .reduce((errorCount: number, reportGroup) => errorCount + counters[reportGroup], 0);

    await measure.print();

    if (totalErrorCount > Number(maxIssues)) process.exit(totalErrorCount);
  } catch (error: unknown) {
    if (error instanceof ConfigurationError) {
      console.error(error.message + '\n');
      printHelp();
      process.exit(1);
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }
};

run();
