import type { CollectorIssues } from '../IssueCollector.js';
import { finalizeConfigurationHints, type ProcessedHint } from '../reporters/util/configuration-hints.js';
import { type Results, run } from '../run.js';
import type { MainOptions } from '../util/create-options.js';
import type { SessionHandler, WatchChange } from '../util/watch.js';
import { buildFileDescriptor, type FileDescriptorOptions } from './file-descriptor.js';
import type { File } from './types.js';

type WatchUpdate = { duration: number; mem: number };

export interface Session {
  handleFileChanges(changes: WatchChange[]): Promise<WatchUpdate>;
  getIssues(): CollectorIssues;
  getResults(): Results;
  getConfigurationHints(): ProcessedHint[];
  describeFile(filePath: string, options?: FileDescriptorOptions): File | undefined;
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
    getConfigurationHints: () => finalizeConfigurationHints(results, options),
    describeFile: (filePath, opts) =>
      buildFileDescriptor(filePath, options.cwd, session.getGraph(), session.getEntryPaths(), opts),
  };
};
