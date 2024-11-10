import prettyMilliseconds from 'pretty-ms';
import { main } from './index.js';
import type { IssueType, ReporterOptions } from './types/issues.js';
import { perfObserver } from './util/Performance.js';
import parsedArgValues, { helpText } from './util/cli-arguments.js';
import { getKnownError, hasCause, isConfigurationError, isKnownError } from './util/errors.js';
import { logError, logWarning } from './util/log.js';
import { cwd, join, toPosix } from './util/path.js';
import { runPreprocessors, runReporters } from './util/reporter.js';
import { splitTags } from './util/tag.js';
import { isTrace } from './util/trace.js';
import { version } from './version.js';

const defaultCacheLocation = join(cwd, 'node_modules', '.cache', 'knip');

const {
  'allow-remove-files': isRemoveFiles = false,
  cache: isCache = false,
  'cache-location': cacheLocation = defaultCacheLocation,
  debug: isDebug = false,
  dependencies: isDependenciesShorthand = false,
  exclude: excludedIssueTypes = [],
  'experimental-tags': experimentalTags = [],
  exports: isExportsShorthand = false,
  files: isFilesShorthand = false,
  fix: isFix = false,
  'fix-type': fixTypes = [],
  help: isHelp,
  include: includedIssueTypes = [],
  'include-entry-exports': isIncludeEntryExports = false,
  'include-libs': isIncludeLibs = false,
  'isolate-workspaces': isIsolateWorkspaces = false,
  'max-issues': maxIssues = '0',
  'no-config-hints': isHideConfigHints = false,
  'no-exit-code': noExitCode = false,
  'no-gitignore': isNoGitIgnore = false,
  'no-progress': isNoProgress = isDebug || isTrace,
  preprocessor = [],
  'preprocessor-options': preprocessorOptions = '',
  production: isProduction = false,
  reporter = ['symbols'],
  'reporter-options': reporterOptions = '',
  strict: isStrict = false,
  tags = [],
  tsConfig,
  version: isVersion,
  watch: isWatch = false,
  workspace: rawWorkspaceArg,
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

const workspace = rawWorkspaceArg ? toPosix(rawWorkspaceArg).replace(/^\.\//, '').replace(/\/$/, '') : undefined;

const run = async () => {
  try {
    const { report, issues, counters, rules, tagHints, configurationHints } = await main({
      cacheLocation,
      cwd,
      excludedIssueTypes,
      fixTypes: fixTypes.flatMap(type => type.split(',')),
      gitignore: !isNoGitIgnore,
      includedIssueTypes,
      isCache,
      isDebug,
      isDependenciesShorthand,
      isExportsShorthand,
      isFilesShorthand,
      isFix: isFix || fixTypes.length > 0,
      isHideConfigHints,
      isIncludeEntryExports,
      isIncludeLibs,
      isIsolateWorkspaces,
      isProduction: isStrict || isProduction,
      isRemoveFiles,
      isShowProgress,
      isStrict,
      isWatch,
      tags: tags.length > 0 ? splitTags(tags) : splitTags(experimentalTags),
      tsConfigFile: tsConfig,
      workspace,
    });

    // These modes have their own reporting mechanism
    if (isWatch || isTrace) return;

    const initialData: ReporterOptions = {
      report,
      issues,
      counters,
      tagHints,
      configurationHints,
      noConfigHints: isHideConfigHints,
      cwd,
      isProduction,
      isShowProgress,
      options: reporterOptions,
      preprocessorOptions,
    };

    const finalData = await runPreprocessors(preprocessor, initialData);

    await runReporters(reporter, finalData);

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
      logWarning('DEPRECATION WARNING', '--experimental-tags is deprecated, please start using --tags instead');
    }

    if (isIsolateWorkspaces && report.classMembers) {
      logWarning('WARNING', 'Class members are not tracked when using the --isolate-workspaces flag');
    }

    if (!noExitCode && totalErrorCount > Number(maxIssues)) {
      process.exit(1);
    }
  } catch (error: unknown) {
    process.exitCode = 2;
    if (!isDebug && error instanceof Error && isKnownError(error)) {
      const knownError = getKnownError(error);
      logError('ERROR', knownError.message);
      if (hasCause(knownError)) console.error('Reason:', knownError.cause.message);
      if (isConfigurationError(knownError)) console.log('\nRun `knip --help` or visit https://knip.dev for help');
      process.exit(2);
    }
    // We shouldn't arrive here, but not swallow either, so re-throw
    throw error;
  }
};

await run();
