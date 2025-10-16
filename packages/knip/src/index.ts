import { watch } from 'node:fs';
import { formatly } from 'formatly';
import { ConfigurationChief } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { analyze } from './graph/analyze.js';
import { build } from './graph/build.js';
import { IssueCollector } from './IssueCollector.js';
import { IssueFixer } from './IssueFixer.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import type { MainOptions } from './util/create-options.js';
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

export const main = async (options: MainOptions) => {
  const { cwd } = options;

  debugLogObject('*', 'Unresolved configuration', options);
  debugLogObject('*', 'Included issue types', options.includedIssueTypes);

  const chief = new ConfigurationChief(options);
  const deputy = new DependencyDeputy(options);
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer(options);
  const fixer = new IssueFixer(options);
  const collector = new IssueCollector(options);

  streamer.cast('Reading workspace configuration');

  const workspaces = await chief.getWorkspaces();
  const isGitIgnored = await getGitIgnoredHandler(options);

  // Set up per-file issue ignoring
  collector.setIgnoreIssues(chief.config.ignoreIssues);

  debugLogObject('*', 'Included workspaces', () => workspaces.map(w => w.pkgName));
  debugLogObject('*', 'Included workspace configs', () =>
    workspaces.map(w => ({ pkgName: w.pkgName, name: w.name, config: w.config, ancestors: w.ancestors }))
  );

  const { graph, entryPaths, analyzedFiles, unreferencedFiles, analyzeSourceFile } = await build({
    chief,
    collector,
    deputy,
    factory,
    isGitIgnored,
    streamer,
    workspaces,
    options,
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
    streamer,
    unreferencedFiles,
    options,
  });

  if (options.isWatch) {
    const isIgnored = (filePath: string) =>
      filePath.startsWith(options.cacheLocation) || filePath.includes('/.git/') || isGitIgnored(filePath);

    const watchHandler = await getWatchHandler(options, {
      analyzedFiles,
      analyzeSourceFile,
      chief,
      collector,
      analyze: reAnalyze,
      factory,
      graph,
      isIgnored,
      streamer,
      unreferencedFiles,
    });

    watch('.', { recursive: true }, watchHandler);
  }

  const { issues, counters, tagHints, configurationHints } = collector.getIssues();

  if (options.isFix) {
    const touchedFiles = await fixer.fixIssues(issues);
    if (options.isFormat) {
      const report = await formatly(Array.from(touchedFiles), { cwd });
      if (report.ran && report.result && (report.result.runner === 'virtual' || report.result.code === 0)) {
        debugLogArray('*', `Formatted files using ${report.formatter.name} (${report.formatter.runner})`, touchedFiles);
      } else {
        debugLogObject('*', 'Formatting files failed', report);
      }
    }
  }

  if (!options.isWatch) streamer.clear();

  return {
    issues,
    counters,
    tagHints,
    configurationHints,
    includedWorkspaceDirs: chief.includedWorkspaces.map(w => w.dir),
  };
};
