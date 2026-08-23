import type { CollectorIssues } from '../IssueCollector.ts';
import { type Results, run } from '../run.ts';
import type { MainOptions } from '../util/create-options.ts';
import { runPreprocessors, toReporterOptions } from '../util/preprocessor.ts';
import type { SessionHandler, WatchChange } from '../util/watch.ts';
import { buildFileDescriptor, type FileDescriptorOptions } from './file-descriptor.ts';
import { buildPackageJsonDescriptor, type PackageJsonFile } from './package-json-descriptor.ts';
import type { File } from './types.ts';

type WatchUpdate = { duration: number; mem: number };

export interface Session {
  handleFileChanges(changes: WatchChange[]): Promise<WatchUpdate | undefined>;
  getIssues(): CollectorIssues;
  getResults(): Results;
  describeFile(filePath: string, options?: FileDescriptorOptions): File | undefined;
  describePackageJson(): PackageJsonFile;
}

export const createSession = async (options: MainOptions): Promise<Session> => {
  const { session, results } = await run(options);

  if (!session) throw new Error('Unable to initialize watch session');

  return createSessionAdapter(session, results, options);
};

const createSessionAdapter = async (
  session: SessionHandler,
  results: Results,
  options: MainOptions
): Promise<Session> => {
  const preprocess = () =>
    runPreprocessors(options.preprocessor, toReporterOptions(options, { ...results, ...session.getIssues() }));

  let data = await preprocess();

  return {
    handleFileChanges: async changes => {
      const update = await session.handleFileChanges(changes);
      data = await preprocess();
      return update;
    },
    getIssues: () => ({
      issues: data.issues,
      counters: data.counters,
      tagHints: data.tagHints,
      configurationHints: data.configurationHints,
    }),
    getResults: () => ({
      issues: data.issues,
      counters: data.counters,
      tagHints: data.tagHints,
      configurationHints: data.configurationHints,
      enabledPlugins: data.enabledPlugins,
      includedWorkspaceDirs: data.includedWorkspaceDirs,
      selectedWorkspaces: data.selectedWorkspaces,
    }),
    describeFile: (filePath, opts) =>
      buildFileDescriptor(filePath, options.cwd, session.getGraph(), session.getEntryPaths(), opts),
    describePackageJson: () => buildPackageJsonDescriptor(session.getGraph(), session.getEntryPaths()),
  };
};
