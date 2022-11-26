#!/usr/bin/env node

import path from 'node:path';
import { register } from 'esbuild-register/dist/node.js';
import reporters from './reporters/index.js';
import { ConfigurationError } from './util/errors.js';
import { printHelp } from './util/help.js';
import parsedArgs from './util/parseArgs.js';
import { measure } from './util/performance.js';
import { main } from './index.js';
import type { IssueType } from './types/issues.js';

register();

const {
  values: {
    debug: isDebug = false,
    help,
    'max-issues': maxIssues = '0',
    'no-exit-code': noExitCode = false,
    'no-gitignore': isNoGitIgnore = false,
    'no-progress': noProgress = false,
    production: isProduction = false,
    reporter = 'symbols',
    'reporter-options': reporterOptions = '',
    strict: isStrict = false,
    tsConfig,
  },
} = parsedArgs;

if (help) {
  printHelp();
  process.exit(0);
}

const cwd = process.cwd();

const isShowProgress =
  !isDebug && noProgress === false && process.stdout.isTTY && typeof process.stdout.cursorTo === 'function';

const printReport =
  reporter in reporters ? reporters[reporter as keyof typeof reporters] : await import(path.join(cwd, reporter));

const run = async () => {
  try {
    const { report, issues, counters } = await main({
      cwd,
      tsConfigFile: tsConfig,
      gitignore: !isNoGitIgnore,
      isStrict,
      isProduction,
      isShowProgress,
    });

    await printReport({ report, issues, cwd, isProduction, options: reporterOptions });

    const totalErrorCount = (Object.keys(report) as IssueType[])
      .filter(reportGroup => report[reportGroup])
      .reduce((errorCount: number, reportGroup) => errorCount + counters[reportGroup], 0);

    await measure.print();

    if (!noExitCode && totalErrorCount > Number(maxIssues)) {
      process.exit(totalErrorCount);
    }
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

await run();
