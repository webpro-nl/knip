import { statSync, watch } from 'node:fs';
import { globSync } from 'tinyglobby';
import { ConsoleStreamer } from '../ConsoleStreamer.ts';
import { GLOBAL_IGNORE_PATTERNS } from '../constants.ts';
import watchReporter from '../reporters/watch.ts';
import type { MainOptions } from '../util/create-options.ts';
import { debugLog } from '../util/debug.ts';
import { hasErrorCause } from '../util/errors.ts';
import { logError } from '../util/log.ts';
import { join, toPosix } from '../util/path.ts';
import { SessionRebuildRequiredError } from './incremental.ts';
import { createPersistentSession, type SessionOptionsLoader } from './session.ts';

export const watchSession = async (options: MainOptions, loadOptions: SessionOptionsLoader) => {
  const streamer = new ConsoleStreamer({ ...options, isWatch: true });
  let isInitial = true;
  const session = await createPersistentSession(async () => {
    if (isInitial) isInitial = false;
    else options = await loadOptions();
    return options;
  });
  const states = new Map<string, string>();
  const readState = (filePath: string) => {
    const stats = statSync(join(options.cwd, filePath), { throwIfNoEntry: false });
    if (stats?.isFile()) return `${stats.ino}:${stats.size}:${stats.mtimeMs}:${stats.ctimeMs}`;
    if (stats?.isDirectory()) return `directory:${stats.ino}`;
  };
  for (const filePath of globSync('**/*', {
    cwd: options.cwd,
    dot: true,
    ignore: GLOBAL_IGNORE_PATTERNS,
    followSymbolicLinks: false,
    onlyFiles: false,
  })) {
    const normalizedPath = filePath.endsWith('/') ? filePath.slice(0, -1) : filePath;
    const state = readState(normalizedPath);
    if (state) states.set(normalizedPath, state);
  }

  const report = (duration?: number) => {
    const { issues, counters } = session.getIssues();
    watchReporter(options, { issues, streamer, size: counters.processed - counters.files, duration });
  };

  let closed = false;
  let pending = Promise.resolve();

  const close = () => {
    closed = true;
    watcher.close();
  };

  const onError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const reason = error instanceof Error && hasErrorCause(error) ? `\nReason: ${error.cause.message}` : '';
    logError(message + reason);
    process.exitCode = 2;
    if (error instanceof SessionRebuildRequiredError && error.reason === 'restart') close();
  };

  const watcher = watch(options.cwd, { recursive: true }, (eventType, filePath) => {
    debugLog('*', `(raw) ${eventType} ${filePath}`);
    if (closed || typeof filePath !== 'string') return;
    const normalizedPath = toPosix(filePath);
    pending = pending
      .then(async () => {
        if (closed) return;
        const previous = states.get(normalizedPath);
        const current = readState(normalizedPath);
        if (previous === current) return;
        if (current) states.set(normalizedPath, current);
        else states.delete(normalizedPath);
        if (previous?.startsWith('directory:')) {
          for (const path of states.keys()) if (path.startsWith(`${normalizedPath}/`)) states.delete(path);
        }
        const type = current ? (previous && !current.startsWith('directory:') ? 'modified' : 'added') : 'deleted';
        const update = await session.handleFileChanges([{ type, filePath: normalizedPath }]);
        if (update && !closed) report(update.duration);
      })
      .catch(onError);
  });

  watcher.on('error', error => {
    onError(error);
    close();
  });

  try {
    report();
  } catch (error) {
    close();
    throw error;
  }

  return {
    close: async () => {
      close();
      await pending;
    },
  };
};
