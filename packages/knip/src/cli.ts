// biome-ignore-all lint/suspicious/noConsole: ignore
import { main } from './index.js';
import type { IssueType, ReporterOptions } from './types/issues.js';
import parseArgs, { helpText } from './util/cli-arguments.js';
import { createOptions } from './util/create-options.js';
import { getKnownErrors, hasErrorCause, isConfigurationError, isKnownError } from './util/errors.js';
import { logError, logWarning } from './util/log.js';
import { perfObserver } from './util/Performance.js';
import { runPreprocessors, runReporters } from './util/reporter.js';
import { prettyMilliseconds } from './util/string.js';
import { version } from './version.js';

let args: ReturnType<typeof parseArgs> = {};
try {
  args = parseArgs();
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
    console.log(`\n${helpText}`);
    process.exit(1);
  }
  throw error;
}

const run = async () => {
  try {
    const options = await createOptions({ args });

    if (args.help) {
      console.log(helpText);
      process.exit(0);
    }

    if (args.version) {
      console.log(version);
      process.exit(0);
    }

    const { issues, counters, tagHints, configurationHints, includedWorkspaceDirs, enabledPlugins } =
      await main(options);

    // These modes have their own reporting mechanism
    if (options.isWatch || options.isTrace) return;

    const initialData: ReporterOptions = {
      report: options.includedIssueTypes,
      issues,
      counters,
      tagHints,
      configurationHints,
      enabledPlugins,
      includedWorkspaceDirs,
      cwd: options.cwd,
      configFilePath: options.configFilePath,
      isDisableConfigHints: options.isDisableConfigHints,
      isProduction: options.isProduction,
      isShowProgress: options.isShowProgress,
      isTreatConfigHintsAsErrors: options.isTreatConfigHintsAsErrors,
      maxShowIssues: args['max-show-issues'] ? Number(args['max-show-issues']) : undefined,
      options: args['reporter-options'] ?? '',
      preprocessorOptions: args['preprocessor-options'] ?? '',
    };

    const finalData = await runPreprocessors(args.preprocessor ?? [], initialData);

    await runReporters(args.reporter ?? ['symbols'], finalData);

    const totalErrorCount = (Object.keys(finalData.report) as IssueType[])
      .filter(reportGroup => finalData.report[reportGroup] && options.rules[reportGroup] === 'error')
      .reduce((errorCount: number, reportGroup) => errorCount + finalData.counters[reportGroup], 0);

    if (perfObserver.isEnabled) await perfObserver.finalize();
    if (perfObserver.isTimerifyFunctions) console.log(`\n${perfObserver.getTimerifiedFunctionsTable()}`);
    if (perfObserver.isMemoryUsageEnabled && !args['memory-realtime'])
      console.log(`\n${perfObserver.getMemoryUsageTable()}`);

    if (perfObserver.isEnabled) {
      const duration = perfObserver.getCurrentDurationInMs();
      console.log('\nTotal running time:', prettyMilliseconds(duration));
      perfObserver.reset();
    }

    if (args['experimental-tags'] && args['experimental-tags'].length > 0) {
      logWarning('DEPRECATION WARNING', '--experimental-tags is deprecated, please start using --tags instead');
    }

    if (options.isIsolateWorkspaces && options.includedIssueTypes.classMembers) {
      logWarning('WARNING', 'Class members are not tracked when using the --isolate-workspaces flag');
    }

    if (
      (!args['no-exit-code'] && totalErrorCount > Number(args['max-issues'] ?? 0)) ||
      (!options.isDisableConfigHints && options.isTreatConfigHintsAsErrors && configurationHints.size > 0)
    ) {
      process.exit(1);
    }
  } catch (error: unknown) {
    process.exitCode = 2;
    if (!args.debug && error instanceof Error && isKnownError(error)) {
      const knownErrors = getKnownErrors(error);
      for (const knownError of knownErrors) logError('ERROR', knownError.message);
      if (hasErrorCause(knownErrors[0])) console.error('Reason:', knownErrors[0].cause.message);
      if (isConfigurationError(knownErrors[0])) console.log('\nRun `knip --help` or visit https://knip.dev for help');
      process.exit(2);
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }

  process.exit(0);
};

await run();
