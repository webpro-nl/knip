#!/usr/bin/env node

import './util/register.js';
import path from 'node:path';
import prettyMilliseconds from 'pretty-ms';
import reporters from './reporters/index.js';
import parsedArgs, { helpText } from './util/cli-arguments.js';
import { ConfigurationError } from './util/errors.js';
import { _load } from './util/loader.js';
import { Performance } from './util/performance.js';
import { version } from './version.js';
import { main } from './index.js';
import type { IssueType } from './types/issues.js';

const {
  debug: isDebug = false,
  help: isHelp,
  'max-issues': maxIssues = '0',
  'no-exit-code': noExitCode = false,
  'no-gitignore': isNoGitIgnore = false,
  'no-progress': isNoProgress = false,
  performance: isObservePerf = false,
  production: isProduction = false,
  reporter = 'symbols',
  'reporter-options': reporterOptions = '',
  strict: isStrict = false,
  tsConfig,
  version: isVersion,
} = parsedArgs.values;

if (isHelp) {
  console.log(helpText);
  process.exit(0);
}

if (isVersion) {
  console.log(version);
  process.exit(0);
}

const cwd = process.cwd();

const isShowProgress =
  !isDebug && isNoProgress === false && process.stdout.isTTY && typeof process.stdout.cursorTo === 'function';

const printReport =
  reporter in reporters ? reporters[reporter as keyof typeof reporters] : await _load(path.join(cwd, reporter));

const run = async () => {
  try {
    const perfObserver = new Performance(isObservePerf);

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

    if (isObservePerf) {
      await perfObserver.finalize();
      console.log('\n' + perfObserver.getTable());
      console.log('\nTotal running time:', prettyMilliseconds(perfObserver.getTotalTime()));
      perfObserver.reset();
    }

    if (!noExitCode && totalErrorCount > Number(maxIssues)) {
      process.exit(totalErrorCount);
    }
  } catch (error: unknown) {
    if (error instanceof ConfigurationError) {
      console.error(error.message + '\n');
      console.log(helpText);
      process.exit(1);
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }
};

await run();
