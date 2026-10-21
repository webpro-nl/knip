import type { CollectorIssues } from '../IssueCollector.ts';
import { type Results, run } from '../run.ts';
import type { MainOptions } from '../util/create-options.ts';
import { clearModuleResolutionCaches } from '../typescript/resolve-module-names.ts';
import { clearGlobCache } from '../util/glob-cache.ts';
import { clearGitignoreCache, flushGitignoreCache } from '../util/gitignore-cache.ts';
import { createPreprocessor, toReporterOptions } from '../util/preprocessor.ts';
import { clearResolverCache } from '../util/resolve.ts';
import type { WatchChange } from '../util/watch.ts';
import { buildFileDescriptor, type FileDescriptorOptions } from './file-descriptor.ts';
import { buildPackageJsonDescriptor, type PackageJsonFile } from './package-json-descriptor.ts';
import type { File } from './types.ts';
import { SessionRebuildRequiredError } from './incremental.ts';

type WatchUpdate = { duration: number; mem: number };

export interface Session {
  handleFileChanges(changes: WatchChange[]): Promise<WatchUpdate | undefined>;
  getIssues(): CollectorIssues;
  getResults(): Results;
  describeFile(filePath: string, options?: FileDescriptorOptions): File | undefined;
  describePackageJson(): PackageJsonFile;
}

export type SessionOptionsLoader = () => Promise<MainOptions>;

export const createSession = async (options: MainOptions, reloadOptions?: SessionOptionsLoader): Promise<Session> => {
  const initialize = async (options: MainOptions, isRebuild = false) => {
    const { session, results } = await run(isRebuild ? { ...options, isCache: false } : options);
    if (!session) throw new Error('Unable to initialize watch session');
    const preprocess = options.preprocessor.length > 0 ? await createPreprocessor(options.preprocessor) : undefined;
    const input = toReporterOptions(options, results);
    const updateResults = async () => {
      const collected = session.getIssues();
      const data = preprocess ? await preprocess({ ...input, ...structuredClone(collected) }) : collected;
      results.issues = data.issues;
      results.counters = data.counters;
      results.tagHints = data.tagHints;
      results.configurationHints = data.configurationHints;
      results.hasConfigLoadErrors = collected.hasConfigLoadErrors;
    };
    await updateResults();
    return { session, results, updateResults, options, preprocess };
  };

  let current = await initialize(options);
  const results = current.results;
  let pending = Promise.resolve();

  const processChanges = async (changes: WatchChange[]) => {
    const startTime = performance.now();
    try {
      const update = await current.session.handleFileChanges(changes, true);
      if (update) {
        await current.updateResults();
        Object.assign(results, current.results);
      }
      return update;
    } catch (error) {
      if (!(error instanceof SessionRebuildRequiredError) || error.reason === 'restart') throw error;
      if (error.reason === 'configuration' && !reloadOptions) throw error;
      clearResolverCache();
      clearModuleResolutionCaches();
      clearGlobCache();
      clearGitignoreCache();
      flushGitignoreCache();
      const refreshed = reloadOptions ? await reloadOptions() : current.options;
      current = await initialize(refreshed, true);
      Object.assign(results, current.results);
      return { duration: performance.now() - startTime, mem: process.memoryUsage().heapUsed };
    }
  };

  return {
    handleFileChanges: changes => {
      const update = pending.then(() => processChanges(changes));
      pending = update.then(
        () => {},
        () => {}
      );
      return update;
    },
    getIssues: () => (current.preprocess ? results : current.session.getIssues()),
    getResults: () => results,
    describeFile: (filePath, opts) =>
      buildFileDescriptor(
        filePath,
        current.options.cwd,
        current.session.getGraph(),
        current.session.getEntryPaths(),
        opts
      ),
    describePackageJson: () => buildPackageJsonDescriptor(current.session.getGraph(), current.session.getEntryPaths()),
  };
};

export const createPersistentSession = async (loadOptions: SessionOptionsLoader): Promise<Session> => {
  const reloadOptions = async () => ({ ...(await loadOptions()), isSession: true, isWatch: false });
  return createSession(await reloadOptions(), reloadOptions);
};
