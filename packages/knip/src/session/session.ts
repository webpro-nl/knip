import type { CollectorIssues } from '../IssueCollector.ts';
import { type Results, run } from '../run.ts';
import type { MainOptions } from '../util/create-options.ts';
import { createPreprocessor, toReporterOptions } from '../util/preprocessor.ts';
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

  const adapter = createSessionAdapter(session, results, options);
  return options.preprocessor.length === 0 ? adapter : withPreprocessor(adapter, options);
};

const createSessionAdapter = (session: SessionHandler, results: Results, options: MainOptions): Session => {
  return {
    handleFileChanges: session.handleFileChanges,
    getIssues: session.getIssues,
    getResults: () => results,
    describeFile: (filePath, opts) =>
      buildFileDescriptor(filePath, options.cwd, session.getGraph(), session.getEntryPaths(), opts),
    describePackageJson: () => buildPackageJsonDescriptor(session.getGraph(), session.getEntryPaths()),
  };
};

const withPreprocessor = async (session: Session, options: MainOptions): Promise<Session> => {
  const results = session.getResults();
  const input = toReporterOptions(options, results);
  const preprocess = await createPreprocessor(options.preprocessor);
  const updateResults = async () => {
    const data = await preprocess({ ...input, ...session.getIssues() });
    results.issues = data.issues;
    results.counters = data.counters;
    results.tagHints = data.tagHints;
    results.configurationHints = data.configurationHints;
  };

  await updateResults();

  return {
    ...session,
    handleFileChanges: async changes => {
      const update = await session.handleFileChanges(changes);
      if (update) await updateResults();
      return update;
    },
    getIssues: () => results,
  };
};
