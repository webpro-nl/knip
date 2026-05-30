import fs from 'node:fs';
// oxlint-disable-next-line no-restricted-imports
import path from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { version } from '../version.ts';
import { debugLog } from './debug.ts';
import { isDirectory, isFile } from './fs.ts';
import { dirname } from './path.ts';

export const mtimeMatches = (filePath: string, mtimeMs: number): boolean => {
  try {
    return fs.statSync(filePath).mtimeMs === mtimeMs;
  } catch {
    return false;
  }
};

export interface DiskCache<V> {
  init: (cacheLocation: string) => void;
  isEnabled: () => boolean;
  get: (key: string) => V | undefined;
  set: (key: string, value: V) => void;
  delete: (key: string) => void;
  clear: () => void;
  flush: () => void;
}

export const createDiskCache = <V>(name: string): DiskCache<V> => {
  const filename = `${name}-${version}.cache`;
  let cacheFilePath: string | undefined;
  let cache: Map<string, V> | undefined;
  let isDirty = false;

  return {
    init(cacheLocation: string) {
      cacheFilePath = path.resolve(cacheLocation, filename);
      if (isFile(cacheFilePath)) {
        try {
          cache = deserialize(fs.readFileSync(cacheFilePath));
        } catch {
          debugLog('*', `Error reading cache from ${cacheFilePath}`);
          cache = new Map();
        }
      } else {
        cache = new Map();
      }
    },
    isEnabled: () => cache !== undefined,
    get: key => cache?.get(key),
    set(key, value) {
      if (!cache) return;
      cache.set(key, value);
      isDirty = true;
    },
    delete(key) {
      if (cache?.delete(key)) isDirty = true;
    },
    clear() {
      if (cache && cache.size > 0) {
        cache.clear();
        isDirty = true;
      }
    },
    flush() {
      if (!cache || !cacheFilePath || !isDirty) return;
      try {
        const dir = dirname(cacheFilePath);
        if (!isDirectory(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(cacheFilePath, serialize(cache));
        isDirty = false;
      } catch {
        debugLog('*', `Error writing cache to ${cacheFilePath}`);
      }
    },
  };
};
