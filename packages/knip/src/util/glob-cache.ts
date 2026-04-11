import { createHash } from 'node:crypto';
import fs from 'node:fs';
// oxlint-disable-next-line no-restricted-imports
import path from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { version } from '../version.ts';
import { debugLog } from './debug.ts';
import { isDirectory, isFile } from './fs.ts';
import { dirname } from './path.ts';

interface GlobCacheEntry {
  paths: string[];
  /** Absolute dir path → mtimeMs of dir at the time the glob ran */
  dirMtimes: Record<string, number>;
}

const CACHE_FILENAME = `glob-${version}.cache`;

let cacheFilePath: string | undefined;
let cache: Map<string, GlobCacheEntry> | undefined;
let isDirty = false;

export const initGlobCache = (cacheLocation: string) => {
  cacheFilePath = path.resolve(cacheLocation, CACHE_FILENAME);
  if (isFile(cacheFilePath)) {
    try {
      cache = deserialize(fs.readFileSync(cacheFilePath));
    } catch {
      debugLog('*', `Error reading glob cache from ${cacheFilePath}`);
      cache = new Map();
    }
  } else {
    cache = new Map();
  }
};

export const isGlobCacheEnabled = () => cache !== undefined;

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
    try {
      const stat = fs.statSync(dir);
      if (stat.mtimeMs !== entry.dirMtimes[dir]) return false;
    } catch {
      return false;
    }
  }
  return true;
};

export const getCachedGlob = (key: string): string[] | undefined => {
  if (!cache) return undefined;
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (!validateEntry(entry)) {
    cache.delete(key);
    isDirty = true;
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
  if (!cache) return;
  cache.set(key, {
    paths,
    dirMtimes: captureDirMtimes(paths, baseDir),
  });
  isDirty = true;
};

export const clearGlobCache = (): void => {
  if (cache) {
    cache.clear();
    isDirty = true;
  }
};

export const flushGlobCache = (): void => {
  if (!cache || !cacheFilePath || !isDirty) return;
  try {
    const dir = dirname(cacheFilePath);
    if (!isDirectory(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(cacheFilePath, serialize(cache));
    isDirty = false;
  } catch {
    debugLog('*', `Error writing glob cache to ${cacheFilePath}`);
  }
};
