import type { CollectorIssues } from '../IssueCollector.ts';
import { type Results, run } from '../run.ts';
import { createOptions, type MainOptions } from '../util/create-options.ts';
import { createPreprocessor, toReporterOptions } from '../util/preprocessor.ts';
import { clearResolverCache } from '../util/resolve.ts';
import { clearModuleResolutionCaches } from '../typescript/resolve-module-names.ts';
import { clearGlobCache } from '../util/glob-cache.ts';
import { clearGitignoreCache } from '../util/gitignore-cache.ts';
import { unload } from '../util/loader.ts';
import type { WatchChange } from '../util/watch.ts';
import { buildFileDescriptor, type FileDescriptorOptions } from './file-descriptor.ts';
import { buildPackageJsonDescriptor, type PackageJsonFile } from './package-json-descriptor.ts';
import type { File } from './types.ts';
import { SessionConfigurationChangedError } from './configuration.ts';

type WatchUpdate = { duration: number; mem: number };

export interface Session {
  handleFileChanges(changes: WatchChange[]): Promise<WatchUpdate | undefined>;
  getIssues(): CollectorIssues;
  getResults(): Results;
  describeFile(filePath: string, options?: FileDescriptorOptions): File | undefined;
  describePackageJson(): PackageJsonFile;
}

export const createSession = async (options: MainOptions): Promise<Session> => {
  const initialize = async (options: MainOptions) => {
    const { session, results } = await run(options);
    if (!session) throw new Error('Unable to initialize watch session');
    const preprocess = options.preprocessor.length > 0 ? await createPreprocessor(options.preprocessor) : undefined;
    const updateResults = async () => {
      const collected = session.getIssues();
      const data = preprocess
        ? await preprocess({ ...toReporterOptions(options, results), ...structuredClone(collected) })
        : collected;
      results.issues = data.issues;
      results.counters = data.counters;
      results.tagHints = data.tagHints;
      results.configurationHints = data.configurationHints;
      results.hasConfigLoadErrors = collected.hasConfigLoadErrors;
    };
    await updateResults();
    return { session, results, options, updateResults, preprocess };
  };

  let current = await initialize(options);
  const results = current.results;
  let pending = Promise.resolve();
  const processChanges = async (changes: WatchChange[]) => {
    try {
      const update = await current.session.handleFileChanges(changes);
      if (update) {
        await current.updateResults();
        Object.assign(results, current.results);
      }
      return update;
    } catch (error) {
      if (!(error instanceof SessionConfigurationChangedError)) throw error;
      const startTime = performance.now();
      clearResolverCache();
      clearModuleResolutionCaches();
      clearGlobCache();
      clearGitignoreCache();
      if (current.session.configurationFiles) unload(current.session.configurationFiles.paths);
      const nextOptions = await createOptions(current.options.createdFrom);
      // Cached per-file resolutions may depend on the previous configuration, so rebuild cold
      current = await initialize({ ...nextOptions, isCache: false });
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
