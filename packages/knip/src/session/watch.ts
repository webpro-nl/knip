import { watch } from 'node:fs';
import { ConsoleStreamer } from '../ConsoleStreamer.ts';
import watchReporter from '../reporters/watch.ts';
import type { MainOptions } from '../util/create-options.ts';
import { debugLog } from '../util/debug.ts';
import { hasErrorCause } from '../util/errors.ts';
import { isFile } from '../util/fs.ts';
import { logError } from '../util/log.ts';
import { toPosix } from '../util/path.ts';
import { createSession } from './session.ts';

export const watchSession = async (options: MainOptions) => {
  const streamer = new ConsoleStreamer(options);
  const session = await createSession(options);
  const report = (duration?: number) => {
    const { issues, counters } = session.getIssues();
    watchReporter(options, { issues, streamer, size: counters.processed - counters.files, duration });
  };
  const onError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const reason = error instanceof Error && hasErrorCause(error) ? `\nReason: ${error.cause.message}` : '';
    logError(message + reason);
    process.exitCode = 2;
  };
  const watcher = watch(options.cwd, { recursive: true }, (eventType, filePath) => {
    debugLog('*', `(raw) ${eventType} ${filePath}`);
    if (typeof filePath !== 'string') return;
    const path = toPosix(filePath);
    const type = eventType === 'rename' ? (isFile(options.cwd, path) ? 'added' : 'deleted') : 'modified';
    session.handleFileChanges([{ type, filePath: path }]).then(update => {
      if (!update) return;
      process.exitCode = 0;
      report(update.duration);
    }, onError);
  });
  watcher.on('error', error => {
    onError(error);
    watcher.close();
  });
  report();
};
