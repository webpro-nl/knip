import { createHash } from 'node:crypto';
import fs from 'node:fs';
import type { FSLike } from 'fdir';
import { createDiskCache } from './disk-cache.ts';

interface GlobCacheEntry {
  paths: string[];
  /** Absolute dir path → mtimeMs of dir at the time the glob ran */
  dirMtimes: Record<string, number>;
}

const store = createDiskCache<GlobCacheEntry>('glob');

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
}): string => {
  const h = createHash('sha1');
  h.update(input.cwd);
  h.update('\0');
  h.update(input.dir);
  h.update('\0');
  h.update(input.gitignore ? '1' : '0');
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
      const stat = fs.statSync(dir);
      mtime = stat.isDirectory() ? stat.mtimeMs : Number.NaN;
    } catch {
      mtime = Number.NaN;
    }
    dirMtimeCache.set(dir, mtime);
  }
  return mtime;
};

const validateEntry = (entry: GlobCacheEntry): boolean => {
  for (const dir in entry.dirMtimes) {
    if (statDirMtime(dir) !== entry.dirMtimes[dir]) return false;
  }
  return true;
};

export const getCachedGlob = (key: string): string[] | undefined => {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (!validateEntry(entry)) {
    store.delete(key);
    return undefined;
  }
  return entry.paths;
};

// Delegate to a native fs function while recording the directory it reads. The native overload +
// `__promisify__` types don't survive a plain wrapper, so bridge them at this single boundary.
const trackReads = <T>(native: T, dirs: Set<string>): T => {
  const tracked = function (this: unknown, path: unknown, ...rest: unknown[]) {
    if (typeof path === 'string') dirs.add(path);
    return (native as (...args: unknown[]) => unknown).call(this, path, ...rest);
  };
  return tracked as unknown as T;
};

/**
 * Records every directory the glob crawl visits. tinyglobby forwards this `fs` to fdir, which reads
 * each traversed directory exactly once — so the recorded set is the complete set of directories whose
 * contents can affect the result, including ones that matched nothing.
 */
export const createDirTracker = (): { dirs: Set<string>; fs: Partial<FSLike> } => {
  const dirs = new Set<string>();
  return { dirs, fs: { readdir: trackReads(fs.readdir, dirs), readdirSync: trackReads(fs.readdirSync, dirs) } };
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
