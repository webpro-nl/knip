import { run } from '../run.js';
import type { Issues } from '../types/issues.js';
import type { MainOptions } from '../util/create-options.js';
import type { SessionHandler, WatchChange } from '../util/watch.js';
import { buildFileDescriptor, type FileDescriptorOptions } from './file-descriptor.js';
import type { File } from './types.js';

type WatchUpdate = { duration: number; mem: number };

export interface Session {
  handleFileChanges(changes: WatchChange[]): Promise<WatchUpdate>;
  getIssues(): Issues;
  describeFile(filePath: string, options?: FileDescriptorOptions): File | null;
}

export const createSession = async (options: MainOptions) => {
  const { session } = await run(options);

  if (!session) throw new Error('Unable to initialize watch session');

  return createSessionAdapter(options.cwd, session);
};

const createSessionAdapter = (cwd: string, session: SessionHandler): Session => {
  return {
    handleFileChanges: session.handleFileChanges,
    getIssues: session.getIssues,
    describeFile: (filePath, options) => {
      return buildFileDescriptor(filePath, cwd, session.getGraph(), session.getEntryPaths(), options);
    },
  };
};
