import { watch } from 'node:fs';
import { formatly } from 'formatly';
import { CatalogCounselor } from './CatalogCounselor.js';
import { ConfigurationChief } from './ConfigurationChief.js';
import { ConsoleStreamer } from './ConsoleStreamer.js';
import { DependencyDeputy } from './DependencyDeputy.js';
import { analyze } from './graph/analyze.js';
import { build } from './graph/build.js';
import { IssueCollector } from './IssueCollector.js';
import { IssueFixer } from './IssueFixer.js';
import { PrincipalFactory } from './PrincipalFactory.js';
import watchReporter from './reporters/watch.js';
import type { MainOptions } from './util/create-options.js';
import { debugLogArray, debugLogObject } from './util/debug.js';
import { getGitIgnoredHandler } from './util/glob-core.js';
import { getSessionHandler, type OnFileChange, type SessionHandler } from './util/watch.js';

export type Results = Awaited<ReturnType<typeof run>>['results'];

export const run = async (options: MainOptions) => {
  debugLogObject('*', 'Unresolved configuration', options);
  debugLogObject('*', 'Included issue types', options.includedIssueTypes);

  const chief = new ConfigurationChief(options);
  const deputy = new DependencyDeputy(options);
  const factory = new PrincipalFactory();
  const streamer = new ConsoleStreamer(options);
  const fixer = new IssueFixer(options);
  const collector = new IssueCollector(options);
  const counselor = new CatalogCounselor(options);

  streamer.cast('Reading workspace configuration');

  const workspaces = await chief.getWorkspaces();
  const isGitIgnored = await getGitIgnoredHandler(options);

  collector.setIgnoreIssues(chief.config.ignoreIssues);

  debugLogObject('*', 'Included workspaces', () => workspaces.map(w => w.pkgName));
  debugLogObject('*', 'Included workspace configs', () =>
    workspaces.map(w => ({ pkgName: w.pkgName, name: w.name, config: w.config, ancestors: w.ancestors }))
  );

  const { graph, entryPaths, analyzedFiles, unreferencedFiles, analyzeSourceFile, enabledPluginsStore } = await build({
    chief,
    collector,
    counselor,
    deputy,
    factory,
    isGitIgnored,
    streamer,
    workspaces,
    options,
  });

  const reAnalyze = await analyze({
    analyzedFiles,
    counselor,
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

  let session: SessionHandler | undefined;

  if (options.isWatch || options.isSession) {
    const isIgnored = (filePath: string) =>
      (!!options.cacheLocation && filePath.startsWith(options.cacheLocation)) ||
      filePath.includes('/.git/') ||
      isGitIgnored(filePath);

    const onFileChange: OnFileChange | undefined = options.isWatch
      ? ({ issues, duration }) => watchReporter(options, { issues, streamer, size: analyzedFiles.size, duration })
      : undefined;

    session = await getSessionHandler(options, {
      analyzedFiles,
      analyzeSourceFile,
      chief,
      collector,
      analyze: reAnalyze,
      factory,
      graph,
      isIgnored,
      onFileChange,
      unreferencedFiles,
      entryPaths,
    });

    if (options.isWatch) watch('.', { recursive: true }, session.listener);
  }

  const { issues, counters, tagHints, configurationHints } = collector.getIssues();

  if (options.isFix && !options.isSession) {
    const touchedFiles = await fixer.fixIssues(issues);
    if (options.isFormat) {
      const report = await formatly(Array.from(touchedFiles));
      if (report.ran && report.result && (report.result.runner === 'virtual' || report.result.code === 0)) {
        debugLogArray('*', `Formatted files using ${report.formatter.name} (${report.formatter.runner})`, touchedFiles);
      } else {
        debugLogObject('*', 'Formatting files failed', report);
      }
    }
  }

  if (!options.isWatch) streamer.clear();

  return {
    results: {
      issues,
      counters,
      tagHints,
      configurationHints,
      includedWorkspaceDirs: chief.includedWorkspaces.map(w => w.dir),
      enabledPlugins: Object.fromEntries(enabledPluginsStore),
    },
    session,
    streamer,
  };
};
