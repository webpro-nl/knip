import { watch } from 'node:fs';
import { ConsoleStreamer } from '../ConsoleStreamer.ts';
import watchReporter from '../reporters/watch.ts';
import type { MainOptions } from '../util/create-options.ts';
import { hasErrorCause } from '../util/errors.ts';
import { isFile } from '../util/fs.ts';
import { logError } from '../util/log.ts';
import { toPosix } from '../util/path.ts';
import { SessionConfigurationChangedError } from './configuration.ts';
import { createSession } from './session.ts';

export const watchSession = async (options: MainOptions, reloadOptions: () => Promise<MainOptions>) => {
  const streamer = new ConsoleStreamer({ ...options, isWatch: true });
  const session = await createSession({ ...options, isSession: true, isWatch: false }, async () => {
    options = await reloadOptions();
    return { ...options, isSession: true, isWatch: false };
  });
  const report = (duration?: number) => {
    const { issues, counters } = session.getIssues();
    watchReporter(options, { issues, streamer, size: counters.processed - counters.files, duration });
  };
  let pending = Promise.resolve();
  let closed = false;
  const close = () => {
    closed = true;
    watcher.close();
  };
  const onError = (error: unknown) => {
    if (closed) return;
    const message = error instanceof Error ? error.message : String(error);
    const reason = error instanceof Error && hasErrorCause(error) ? `\nReason: ${error.cause.message}` : '';
    logError(message + reason);
    process.exitCode = 2;
    if (error instanceof SessionConfigurationChangedError && error.requiresRestart) close();
  };
  const watcher = watch(options.cwd, { recursive: true }, (eventType, filePath) => {
    if (closed || typeof filePath !== 'string') return;
    const path = toPosix(filePath);
    const type = eventType === 'rename' ? (isFile(options.cwd, path) ? 'added' : 'deleted') : 'modified';
    pending = pending
      .then(async () => {
        if (closed) return;
        const update = await session.handleFileChanges([{ type, filePath: path }]);
        if (update) {
          process.exitCode = 0;
          report(update.duration);
        }
      })
      .catch(onError);
  });
  watcher.on('error', error => {
    onError(error);
    close();
  });
  report();
  return {
    close: async () => {
      close();
      await pending;
    },
  };
};
