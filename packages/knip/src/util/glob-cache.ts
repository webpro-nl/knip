import { createHash } from 'node:crypto';
import fs from 'node:fs';
import type { FileSystemAdapter } from 'tinyglobby';
import { createDiskCache } from './disk-cache.ts';
import { toPosix } from './path.ts';

interface DirFingerprint {
  mtimeMs: number;
  ctimeMs: number;
  dev: number;
  ino: number;
}

type GlobCacheEntry = { paths: string[] } & (
  | {
      /** Absolute dir path → mtimeMs of dir at the time the glob ran */
      dirMtimes: Record<string, number>;
    }
  | { dirStats: Record<string, DirFingerprint> }
);

const store = createDiskCache<GlobCacheEntry | { emptyHint: true }>('glob');

// Dir mtimes are constant during a run, so memoize stat across the many cache entries that share dirs.
const dirMtimeCache = new Map<string, number>();

export const initGlobCache = (cacheLocation: string) => {
  dirMtimeCache.clear();
  store.init(cacheLocation);
};
export const isGlobCacheEnabled = store.isEnabled;
export const flushGlobCache = store.flush;
export const clearGlobCache = () => {
  dirMtimeCache.clear();
  store.clear();
};

export const computeGlobCacheKey = (input: {
  patterns: string[];
  cwd: string;
  dir: string;
  gitignore: boolean;
  gitignoreFingerprint: string;
}): string => {
  const h = createHash('sha1');
  h.update(input.cwd);
  h.update('\0');
  h.update(input.dir);
  h.update('\0');
  h.update(input.gitignore ? '1' : '0');
  h.update('\0');
  h.update(input.gitignoreFingerprint);
  h.update('\0');
  for (const p of input.patterns) {
    h.update(p);
    h.update('\0');
  }
  return h.digest('base64url');
};

const statDirMtime = (dir: string): number => {
  let mtime = dirMtimeCache.get(dir);
  if (mtime === undefined) {
    try {
      const stat = fs.statSync(dir, { throwIfNoEntry: false });
      mtime = stat?.isDirectory() ? stat.mtimeMs : Number.NaN;
    } catch {
      mtime = Number.NaN;
    }
    dirMtimeCache.set(dir, mtime);
  }
  return mtime;
};

const statEmptyDir = (dir: string): DirFingerprint | undefined => {
  try {
    const stat = fs.statSync(dir, { throwIfNoEntry: false });
    if (
      stat?.isDirectory() &&
      Number.isFinite(stat.mtimeMs) &&
      Number.isFinite(stat.ctimeMs) &&
      Number.isSafeInteger(stat.dev) &&
      Number.isSafeInteger(stat.ino) &&
      stat.ino > 0 &&
      toPosix(fs.realpathSync.native(dir)) === dir
    ) {
      return { mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, dev: stat.dev, ino: stat.ino };
    }
  } catch {
    return undefined;
  }
};

const validateEmptyDirs = (dirStats: Record<string, DirFingerprint>): boolean => {
  for (const dir in dirStats) {
    const previous = dirStats[dir];
    const current = statEmptyDir(dir);
    if (
      !current ||
      current.mtimeMs !== previous.mtimeMs ||
      current.ctimeMs !== previous.ctimeMs ||
      current.dev !== previous.dev ||
      current.ino !== previous.ino
    )
      return false;
  }
  return true;
};

const validateEntry = (entry: GlobCacheEntry): boolean => {
  if ('dirStats' in entry) return validateEmptyDirs(entry.dirStats);
  if (entry.paths.length === 0) return false;
  for (const dir in entry.dirMtimes) {
    if (statDirMtime(dir) !== entry.dirMtimes[dir]) return false;
  }
  return true;
};

export const shouldTrackEmptyGlob = (key: string): boolean => {
  const entry = store.get(key);
  return !!entry && ('emptyHint' in entry || 'dirStats' in entry);
};

export const getCachedGlob = (key: string, allowEmpty = false): string[] | undefined => {
  const entry = store.get(key);
  if (!entry || 'emptyHint' in entry || ((entry.paths.length === 0 || 'dirStats' in entry) && !allowEmpty))
    return undefined;
  if (!validateEntry(entry)) {
    if ('dirStats' in entry) store.set(key, { emptyHint: true });
    else store.delete(key);
    return undefined;
  }
  return 'dirStats' in entry ? [] : entry.paths;
};

// Delegate to a native fs function while recording the directory it reads. The native overload +
// `__promisify__` types don't survive a plain wrapper, so bridge them at this single boundary.
const trackReads = <T>(
  native: T,
  dirs: Set<string>,
  onRead?: (error: unknown) => void,
  beforeRead?: (path: unknown) => void
): T => {
  const tracked = function (this: unknown, path: unknown, ...rest: unknown[]) {
    if (typeof path === 'string') dirs.add(path);
    beforeRead?.(path);
    if (onRead) {
      const callback = rest.at(-1);
      if (typeof callback === 'function') {
        rest[rest.length - 1] = function (this: unknown, ...args: unknown[]) {
          onRead(args[0]);
          return callback.apply(this, args);
        };
      }
    }
    return (native as (...args: unknown[]) => unknown).call(this, path, ...rest);
  };
  return tracked as unknown as T;
};

interface DirTracker {
  dirs: Set<string>;
  fs: FileSystemAdapter;
  dirStats: Record<string, DirFingerprint>;
  canCacheEmpty: () => boolean;
}

/**
 * Records every directory the glob crawl visits. tinyglobby forwards this `fs` to fdir, which reads
 * each traversed directory exactly once — so the recorded set is the complete set of directories whose
 * contents can affect the result, including ones that matched nothing.
 */
export const createDirTracker = (emptyBaseDir?: string): DirTracker => {
  const dirs = new Set<string>();
  const dirStats: Record<string, DirFingerprint> = {};
  let hasSuccessfulRead = false;
  let hasFailedRead = false;
  const beforeRead =
    emptyBaseDir === undefined
      ? undefined
      : (path: unknown) => {
          if (typeof path !== 'string') {
            hasFailedRead = true;
            return;
          }
          const dir = path.length === 3 && path[1] === ':' && path[2] === '/' ? path : stripTrailingSlash(path);
          if (dir in dirStats) return;
          const stat = statEmptyDir(dir);
          if (stat) dirStats[dir] = stat;
          else hasFailedRead = true;
        };
  beforeRead?.(emptyBaseDir);
  const onRead =
    emptyBaseDir !== undefined
      ? (error: unknown) => {
          if (error) hasFailedRead = true;
          else hasSuccessfulRead = true;
        }
      : undefined;
  return {
    dirs,
    fs: { readdir: trackReads(fs.readdir, dirs, onRead, beforeRead), readdirSync: trackReads(fs.readdirSync, dirs) },
    dirStats,
    canCacheEmpty: () => hasSuccessfulRead && !hasFailedRead,
  };
};

const stripTrailingSlash = (dir: string) => (dir.length > 1 && dir.endsWith('/') ? dir.slice(0, -1) : dir);

const captureDirMtimes = (dirs: Iterable<string>, baseDir: string): Record<string, number> => {
  const result: Record<string, number> = {};
  // Always track the base dir to catch new top-level entries even when the crawl root sits deeper.
  const baseMtime = statDirMtime(baseDir);
  if (!Number.isNaN(baseMtime)) result[baseDir] = baseMtime;
  for (const dir of dirs) {
    const d = stripTrailingSlash(dir);
    if (d in result) continue;
    const mtime = statDirMtime(d);
    if (!Number.isNaN(mtime)) result[d] = mtime;
  }
  return result;
};

export const setCachedGlob = (key: string, paths: string[], baseDir: string, dirs: Iterable<string> = []): void => {
  store.set(key, { paths, dirMtimes: captureDirMtimes(dirs, baseDir) });
};

export const setCachedEmptyGlob = (key: string, tracker: DirTracker): void => {
  if (tracker.canCacheEmpty() && validateEmptyDirs(tracker.dirStats))
    store.set(key, { paths: [], dirStats: tracker.dirStats });
  else store.set(key, { emptyHint: true });
};
