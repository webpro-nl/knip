import { watch } from 'node:fs';
import { formatly } from 'formatly';
import { ConfigurationChief } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { IssueCollector } from './IssueCollector.js';
import { IssueFixer } from './IssueFixer.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import { analyze } from './graph/analyze.js';
import { build } from './graph/build.js';
import type { CommandLineOptions } from './types/cli.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { getGitIgnoredHandler } from './util/glob-core.js';
import { getWatchHandler } from './util/watch.js';

export type { RawConfiguration as KnipConfig } from './types/config.js';
export type { Preprocessor, Reporter, ReporterOptions } from './types/issues.js';

/**
 * The main sequence
 *
 * 1. Build the internal ModuleGraph
 *    - Run plugins to add entry files + references to external dependencies/binaries to DependencyDeputy
 *    - Create graph nodes of source files/modules with imports and exports
 * 2. Analyze the `graph` to populate the IssueCollector
 *    - Settle imports against exports, add external dependency imports to DependencyDeputy
 *    - Settle dependency related issues in DependencyDeputy
 */

export const main = async (unresolvedConfiguration: CommandLineOptions) => {
  const {
    cacheLocation,
    cwd,
    excludedIssueTypes,
    fixTypes,
    gitignore,
    includedIssueTypes,
    isCache,
    isDebug,
    isDependenciesShorthand,
    isExportsShorthand,
    isFilesShorthand,
    isFix,
    isFormat,
    isIncludeEntryExports,
    isIncludeLibs,
    isIsolateWorkspaces,
    isProduction,
    isRemoveFiles,
    isShowProgress,
    isStrict,
    isWatch,
    tags,
    tsConfigFile,
    workspace,
  } = unresolvedConfiguration;

  debugLogObject('*', 'Unresolved configuration (from CLI arguments)', unresolvedConfiguration);

  const chief = new ConfigurationChief({ cwd, isProduction, isStrict, isIncludeEntryExports, workspace });
  const deputy = new DependencyDeputy({ isProduction, isStrict });
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer({ isEnabled: isShowProgress });

  streamer.cast('Reading workspace configuration');

  await chief.init();

  const workspaces = chief.getWorkspaces();
  const report = chief.getIncludedIssueTypes({
    includedIssueTypes,
    excludedIssueTypes,
    isDependenciesShorthand,
    isExportsShorthand,
    isFilesShorthand,
  });
  const rules = chief.getRules();
  const filters = chief.getFilters();
  const finalTags = tags[0].length > 0 || tags[1].length > 0 ? tags : chief.getTags();
  const fixer = new IssueFixer({ isEnabled: isFix, cwd, fixTypes, isRemoveFiles });

  debugLogObject('*', 'Included issue types', report);

  const isReportClassMembers = report.classMembers;
  const isSkipLibs = !(isIncludeLibs || isReportClassMembers);

  const collector = new IssueCollector({ cwd, rules, filters });

  const o = () => workspaces.map(w => ({ pkgName: w.pkgName, name: w.name, config: w.config, ancestors: w.ancestors }));
  debugLogObject('*', 'Included workspaces', () => workspaces.map(w => w.pkgName));
  debugLogObject('*', 'Included workspace configs', o);

  const isGitIgnored = await getGitIgnoredHandler({ cwd, gitignore });

  const { graph, entryPaths, analyzedFiles, unreferencedFiles, analyzeSourceFile } = await build({
    cacheLocation,
    chief,
    collector,
    cwd,
    deputy,
    factory,
    gitignore,
    isCache,
    isFixExports: fixer.isEnabled && fixer.isFixUnusedExports,
    isFixTypes: fixer.isEnabled && fixer.isFixUnusedTypes,
    isGitIgnored,
    isIsolateWorkspaces,
    isProduction,
    isSkipLibs,
    isStrict,
    isWatch,
    report,
    streamer,
    tags: finalTags,
    tsConfigFile,
    workspaces,
  });

  const reAnalyze = await analyze({
    analyzedFiles,
    chief,
    collector,
    deputy,
    entryPaths,
    factory,
    fixer,
    graph,
    isFix,
    isIncludeLibs,
    isProduction,
    report,
    streamer,
    tags: finalTags,
    unreferencedFiles,
  });

  const { issues, counters, tagHints, configurationHints } = collector.getIssues();

  for (const hint of chief.getConfigurationHints()) collector.addConfigurationHint(hint);

  if (isWatch) {
    const isIgnored = (filePath: string) =>
      filePath.startsWith(cacheLocation) || filePath.includes('/.git/') || isGitIgnored(filePath);

    const watchHandler = await getWatchHandler({
      analyzedFiles,
      analyzeSourceFile,
      chief,
      collector,
      analyze: reAnalyze,
      cwd,
      factory,
      graph,
      isDebug,
      isIgnored,
      report,
      streamer,
      unreferencedFiles,
    });

    watch('.', { recursive: true }, watchHandler);
  }

  if (isFix) {
    const touchedFiles = await fixer.fixIssues(issues);
    if (isFormat) {
      const report = await formatly(Array.from(touchedFiles), { cwd });
      if (report.ran && report.result.code === 0) {
        debugLogArray('*', `Formatted files using ${report.formatter.name} (${report.formatter.runner})`, touchedFiles);
      } else {
        debugLogObject('*', 'Formatting files failed', report);
      }
    }
  }

  if (!isWatch) streamer.clear();

  return {
    report,
    issues,
    counters,
    rules,
    tagHints,
    configurationHints,
    isTreatConfigHintsAsErrors: chief.config.isTreatConfigHintsAsErrors,
    includedWorkspaces: chief.includedWorkspaces,
  };
};
