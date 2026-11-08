/* oxlint-disable no-console */
import { fix } from './IssueFixer.ts';
import { run } from './run.ts';
import type { IssueType } from './types/issues.ts';
import type { ParsedCLIArgs } from './util/cli-arguments.ts';
import { createOptions } from './util/create-options.ts';
import {
  getKnownErrors,
  hasErrorCause,
  isConfigurationError,
  isKnownError,
  isLoaderError,
  isModuleNotFoundError,
} from './util/errors.ts';
import { logError } from './util/log.ts';
import { perfObserver } from './util/Performance.ts';
import { createPreprocessor, toReporterOptions } from './util/preprocessor.ts';
import { runReporters } from './util/reporter.ts';
import { prettyMilliseconds } from './util/string.ts';
import { hasUnhandledRejection, listenForUnhandledRejections } from './util/unhandled-rejection.ts';
import { watchSession } from './session/watch.ts';

export const runCLI = async (args: ParsedCLIArgs) => {
  let cwd = process.cwd();
  listenForUnhandledRejections(() => cwd);
  if (perfObserver.isEnabled || perfObserver.isDurationEnabled) perfObserver.startRun();
  try {
    const options = await createOptions({ args });
    cwd = options.cwd;

    if (options.isWatch) {
      await watchSession(options);
      return;
    }

    const { results } = await run(options);

    // These modes have their own reporting mechanism
    if (options.isWatch || options.isTrace) return;

    const preprocess = await createPreprocessor(options.preprocessor);
    const finalData = await preprocess(toReporterOptions(options, results, args));

    if (options.isFix) await fix(finalData.issues, finalData.counters, options);

    await runReporters(args.reporter ?? ['symbols'], args['output-file'] ?? [], finalData);

    const totalErrorCount = (Object.keys(finalData.report) as IssueType[])
      .filter(reportGroup => finalData.report[reportGroup] && options.rules[reportGroup] === 'error')
      .reduce((errorCount: number, reportGroup) => errorCount + finalData.counters[reportGroup], 0);

    if (perfObserver.isEnabled || perfObserver.isDurationEnabled) perfObserver.finalize();
    if (perfObserver.isTimerifyFunctions) console.log(`\n${perfObserver.getTimerifiedFunctionsTable()}`);
    if (perfObserver.isMemoryUsageEnabled && !args['memory-realtime'])
      console.log(`\n${perfObserver.getMemoryUsageTable()}`);

    if (perfObserver.isEnabled || perfObserver.isDurationEnabled) {
      const duration = perfObserver.getCurrentDurationInMs();
      const startup = perfObserver.getProcessDurationInMs() - duration;
      console.log(`\nTotal running time: ${prettyMilliseconds(duration)} (+${prettyMilliseconds(startup)} startup)`);
      perfObserver.reset();
    }

    if (results.hasConfigLoadErrors || hasUnhandledRejection()) {
      process.exitCode = 2;
      return;
    }

    if (
      !args['no-exit-code'] &&
      (totalErrorCount > options.maxIssues ||
        (!options.isDisableConfigHints &&
          options.isTreatConfigHintsAsErrors &&
          finalData.configurationHints.length > 0) ||
        (!options.isDisableTagHints && options.isTreatTagHintsAsErrors && finalData.tagHints.size > 0))
    ) {
      process.exitCode = 1;
      return;
    }
  } catch (error: unknown) {
    process.exitCode = 2;
    if (!args.debug && error instanceof Error && isKnownError(error)) {
      const knownErrors = getKnownErrors(error);
      for (const knownError of knownErrors) logError(knownError.message);
      if (hasErrorCause(knownErrors[0])) {
        console.error('Reason:', knownErrors[0].cause.message);
        if (isModuleNotFoundError(knownErrors[0].cause))
          console.log('Module load error? Visit https://knip.dev/reference/known-issues');
        if (isLoaderError(knownErrors[0]))
          console.log('Configuration file load error? Visit https://knip.dev/reference/known-issues');
      }
      if (isConfigurationError(knownErrors[0])) console.log('\nRun `knip --help` or visit https://knip.dev for help');
      process.exitCode = 2;
      return;
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }

  process.exitCode = 0;
};
