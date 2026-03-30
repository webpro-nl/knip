import type { CollectorIssues } from '../IssueCollector.ts';
import { type Results, run } from '../run.ts';
import type { MainOptions } from '../util/create-options.ts';
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
