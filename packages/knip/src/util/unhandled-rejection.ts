import { AsyncLocalStorage } from 'node:async_hooks';
import { formatCauseMessage } from './errors.ts';
import { logError } from './log.ts';
import { toRelative } from './path.ts';

type Cache = { removeEntry: (filePath: string) => void; reconcile: () => void };

const loading = new AsyncLocalStorage<string>();
let loads: Map<string, Cache> | undefined;
let isRejected = false;

export const hasUnhandledRejection = () => isRejected;

export const trackConfigLoad = <T>(configFilePath: string, cache: Cache, fn: () => Promise<T>) => {
  loads?.set(configFilePath, cache);
  return loading.run(configFilePath, fn);
};

export const listenForUnhandledRejections = (getCwd: () => string) => {
  const tracked = (loads = new Map<string, Cache>());
  process.on('unhandledRejection', reason => {
    isRejected = true;
    process.exitCode = 2;
    const cwd = getCwd();
    const likelyFrom = loading.getStore();
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const origin = likelyFrom ? `, likely from ${toRelative(likelyFrom, cwd)}` : '';
    logError(`Unhandled rejection${origin} (${formatCauseMessage(error, cwd)})`);
    logError('Please fix or visit https://knip.dev/reference/known-issues');
    for (const [configFilePath, cache] of tracked) cache.removeEntry(configFilePath);
    for (const cache of new Set(tracked.values())) cache.reconcile();
  });
};
