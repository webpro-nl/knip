import './util/register.js';
import prettyMilliseconds from 'pretty-ms';
import parsedArgValues, { helpText } from './util/cli-arguments.js';
import { isKnownError, getKnownError, isConfigurationError, hasCause } from './util/errors.js';
import { cwd } from './util/path.js';
import { Performance } from './util/Performance.js';
import { runPreprocessors, runReporters } from './util/reporter.js';
import { version } from './version.js';
import { main } from './index.js';
import type { ReporterOptions, IssueType } from './types/issues.js';

const {
  debug: isDebug = false,
  trace: isTrace = false,
  help: isHelp,
  'max-issues': maxIssues = '0',
  'no-config-hints': noConfigHints = false,
  'no-exit-code': noExitCode = false,
  'no-gitignore': isNoGitIgnore = false,
  'no-progress': isNoProgress = isDebug || isTrace || false,
  'include-entry-exports': isIncludeEntryExports = false,
  'isolate-workspaces': isIsolateWorkspaces = false,
  performance: isObservePerf = false,
  production: isProduction = false,
  'reporter-options': reporterOptions = '',
  'preprocessor-options': preprocessorOptions = '',
  strict: isStrict = false,
  fix: isFix = false,
  'fix-type': fixTypes = [],
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

const isShowProgress = isNoProgress === false && process.stdout.isTTY && typeof process.stdout.cursorTo === 'function';

const run = async () => {
  try {
    const perfObserver = new Performance(isObservePerf);

    const { report, issues, counters, rules, configurationHints } = await main({
      cwd,
      tsConfigFile: tsConfig,
      gitignore: !isNoGitIgnore,
      isProduction,
      isStrict,
      isShowProgress,
      isIncludeEntryExports,
      isIsolateWorkspaces,
      isFix: isFix || fixTypes.length > 0,
      fixTypes: fixTypes.flatMap(type => type.split(',')),
    });

    const initialData: ReporterOptions = {
      report,
      issues,
      counters,
      configurationHints,
      noConfigHints,
      cwd,
      isProduction,
      isShowProgress,
      options: reporterOptions,
      preprocessorOptions,
    };

    const finalData = await runPreprocessors(initialData);

    await runReporters(finalData);

    const totalErrorCount = (Object.keys(finalData.report) as IssueType[])
      .filter(reportGroup => finalData.report[reportGroup] && rules[reportGroup] === 'error')
      .reduce((errorCount: number, reportGroup) => errorCount + finalData.counters[reportGroup], 0);

    if (isObservePerf) {
      await perfObserver.finalize();
      console.log('\n' + perfObserver.getTable());
      const mem = Math.round((perfObserver.getMemHeapUsage() / 1024 / 1024) * 100) / 100;
      console.log('\nTotal running time:', prettyMilliseconds(perfObserver.getTotalTime()), `(mem: ${mem}MB)`);
      perfObserver.reset();
    }

    if (!noExitCode && totalErrorCount > Number(maxIssues)) {
      process.exit(1);
    }
  } catch (error: unknown) {
    process.exitCode = 2;
    if (!isDebug && error instanceof Error && isKnownError(error)) {
      const knownError = getKnownError(error);
      console.error(knownError.message);
      if (hasCause(knownError)) console.error('Reason:', knownError.cause.message);
      if (isConfigurationError(knownError)) console.log('\n' + helpText);
      process.exit(2);
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }
};

await run();
