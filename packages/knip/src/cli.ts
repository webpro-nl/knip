import picocolors from 'picocolors';
import prettyMilliseconds from 'pretty-ms';
import { main } from './index.js';
import type { IssueType, ReporterOptions } from './types/issues.js';
import { perfObserver } from './util/Performance.js';
import parsedArgValues, { helpText } from './util/cli-arguments.js';
import { getKnownError, hasCause, isConfigurationError, isKnownError } from './util/errors.js';
import { cwd } from './util/path.js';
import { runPreprocessors, runReporters } from './util/reporter.js';
import { splitTags } from './util/tag.js';
import { version } from './version.js';

const {
  debug: isDebug = false,
  trace: isTrace = false,
  help: isHelp,
  'max-issues': maxIssues = '0',
  'no-config-hints': noConfigHints = false,
  'no-exit-code': noExitCode = false,
  'no-gitignore': isNoGitIgnore = false,
  'no-progress': isNoProgress = isDebug || isTrace,
  'include-entry-exports': isIncludeEntryExports = false,
  'include-libs': isIncludeLibs = false,
  'isolate-workspaces': isIsolateWorkspaces = false,
  production: isProduction = false,
  'reporter-options': reporterOptions = '',
  'preprocessor-options': preprocessorOptions = '',
  strict: isStrict = false,
  fix: isFix = false,
  'fix-type': fixTypes = [],
  tsConfig,
  version: isVersion,
  'experimental-tags': experimentalTags = [],
  tags = [],
  watch: isWatch = false,
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
    const { report, issues, counters, rules, configurationHints } = await main({
      cwd,
      tsConfigFile: tsConfig,
      gitignore: !isNoGitIgnore,
      isDebug,
      isProduction: isStrict || isProduction,
      isStrict,
      isShowProgress,
      isIncludeEntryExports,
      isIncludeLibs,
      isIsolateWorkspaces,
      isWatch,
      tags: tags.length > 0 ? splitTags(tags) : splitTags(experimentalTags),
      isFix: isFix || fixTypes.length > 0,
      fixTypes: fixTypes.flatMap(type => type.split(',')),
    });

    if (isWatch) return;

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

    if (perfObserver.isEnabled) {
      await perfObserver.finalize();
      console.log(`\n${perfObserver.getTable()}`);
      const mem = perfObserver.getCurrentMemUsageInMb();
      const duration = perfObserver.getCurrentDurationInMs();
      console.log('\nTotal running time:', prettyMilliseconds(duration), `(mem: ${mem}MB)`);
      perfObserver.reset();
    }

    if (experimentalTags.length > 0) {
      const prefix = `${picocolors.yellow('DEPRECATION WARNING:')}`;
      console.warn(`\n${prefix} --experimental-tags is deprecated, please start using --tags instead`);
    }

    if (!noExitCode && totalErrorCount > Number(maxIssues)) {
      process.exit(1);
    }
  } catch (error: unknown) {
    process.exitCode = 2;
    if (!isDebug && error instanceof Error && isKnownError(error)) {
      const knownError = getKnownError(error);
      const prefix = `${picocolors.red('ERROR:')}`;
      console.error(`${prefix} ${knownError.message}`);
      if (hasCause(knownError)) console.error('Reason:', knownError.cause.message);
      if (isConfigurationError(knownError)) console.log(`\n${helpText}`);
      process.exit(2);
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }
};

await run();
