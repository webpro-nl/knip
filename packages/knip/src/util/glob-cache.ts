import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createDiskCache, mtimeMatches } from './disk-cache.ts';
import { dirname } from './path.ts';

interface GlobCacheEntry {
  paths: string[];
  /** Absolute dir path → mtimeMs of dir at the time the glob ran */
  dirMtimes: Record<string, number>;
}

const store = createDiskCache<GlobCacheEntry>('glob');

export const initGlobCache = store.init;
export const isGlobCacheEnabled = store.isEnabled;
export const flushGlobCache = store.flush;
export const clearGlobCache = store.clear;

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

const validateEntry = (entry: GlobCacheEntry): boolean => {
  for (const dir in entry.dirMtimes) {
    if (!mtimeMatches(dir, entry.dirMtimes[dir])) return false;
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

const captureDirMtimes = (paths: string[], baseDir: string): Record<string, number> => {
  const dirs = new Set<string>();
  // Always track the base dir to catch new top-level files/dirs
  dirs.add(baseDir);
  for (const p of paths) {
    let d = dirname(p);
    while (d.length >= baseDir.length) {
      if (dirs.has(d)) break;
      dirs.add(d);
      const parent = dirname(d);
      if (parent === d) break;
      d = parent;
    }
  }
  const result: Record<string, number> = {};
  for (const d of dirs) {
    try {
      const stat = fs.statSync(d);
      if (stat.isDirectory()) result[d] = stat.mtimeMs;
    } catch {
      // dir disappeared between glob and stat — skip
    }
  }
  return result;
};

export const setCachedGlob = (key: string, paths: string[], baseDir: string): void => {
  store.set(key, { paths, dirMtimes: captureDirMtimes(paths, baseDir) });
};
