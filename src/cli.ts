#!/usr/bin/env node

import './util/register.js';
import prettyMilliseconds from 'pretty-ms';
import internalReporters from './reporters/index.js';
import parsedArgValues, { helpText } from './util/cli-arguments.js';
import { isKnownError, getKnownError, isConfigurationError, hasCause } from './util/errors.js';
import { _load } from './util/loader.js';
import { cwd, resolve } from './util/path.js';
import { Performance } from './util/Performance.js';
import { version } from './version.js';
import { main } from './index.js';
import type { ReporterOptions, IssueType } from './types/issues.js';

const {
  debug: isDebug = false,
  help: isHelp,
  'max-issues': maxIssues = '0',
  'no-config-hints': noConfigHints = false,
  'no-exit-code': noExitCode = false,
  'no-gitignore': isNoGitIgnore = false,
  'no-progress': isNoProgress = false,
  'ignore-internal': isIgnoreInternal = false,
  'include-entry-exports': isIncludeEntryExports = false,
  performance: isObservePerf = false,
  production: isProduction = false,
  preprocessor = [],
  reporter = ['symbols'],
  'reporter-options': reporterOptions = '',
  strict: isStrict = false,
  tsConfig,
  version: isVersion,
} = parsedArgValues;

if (isHelp) {
  console.log(helpText);
  process.exit(0);
}

if (isVersion) {
  console.log(version);
  process.exit(0);
}

const isShowProgress =
  !isDebug && isNoProgress === false && process.stdout.isTTY && typeof process.stdout.cursorTo === 'function';

const preprocessors = await Promise.all(preprocessor.map(processor => _load(resolve(processor))));

const processAsync = (data: ReporterOptions, processors: typeof preprocessors): Promise<ReporterOptions> =>
  processors.length === 0 ? Promise.resolve(data) : processAsync(processors[0](data), processors.slice(1));

const reporters = await Promise.all(
  reporter.map(async reporter => {
    return reporter in internalReporters
      ? internalReporters[reporter as keyof typeof internalReporters]
      : await _load(resolve(reporter));
  })
);

const run = async () => {
  try {
    const perfObserver = new Performance(isObservePerf);

    const { report, issues, counters, rules, configurationHints } = await main({
      cwd,
      tsConfigFile: tsConfig,
      gitignore: !isNoGitIgnore,
      isProduction,
      isStrict,
      isIgnoreInternal,
      isShowProgress,
      isIncludeEntryExports,
    });

    const initialData: ReporterOptions = {
      report,
      issues,
      configurationHints,
      noConfigHints,
      cwd,
      isProduction,
      isShowProgress,
      options: reporterOptions,
    };

    const finalData = await processAsync(initialData, preprocessors);

    for (const reporter of reporters) await reporter(finalData);

    const totalErrorCount = (Object.keys(report) as IssueType[])
      .filter(reportGroup => report[reportGroup] && rules[reportGroup] === 'error')
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
    if (error instanceof Error && isKnownError(error)) {
      const knownError = getKnownError(error);
      console.error(knownError.message);
      if (hasCause(knownError)) console.error('Reason:', knownError.cause.message);
      if (isConfigurationError(knownError)) console.log('\n' + helpText);
      process.exit(1);
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }
};

await run();
