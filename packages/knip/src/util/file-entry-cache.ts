/**
 * Credits for this idea go to file-entry-cache, this is a modified and simplified version.
 * - https://github.com/jaredwray/cacheable/blob/main/packages/file-entry-cache/README.md
 * - https://github.com/jaredwray/cacheable/blob/main/packages/file-entry-cache/LICENSE
 */
import fs from 'node:fs';
// oxlint-disable-next-line no-restricted-imports
import path from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { debugLog } from './debug.ts';
import { isDirectory, isFile } from './fs.ts';
import { timerify } from './Performance.ts';
import { dirname, isAbsolute, resolve } from './path.ts';

type MetaData<T> = { size: number; mtime: number; data?: T };

export type FileDescriptor<T> = {
  key: string;
  changed?: boolean;
  notFound?: boolean;
  err?: unknown;
  meta?: MetaData<T>;
};

const createCache = (filePath: string) => {
  try {
    return deserialize(fs.readFileSync(filePath));
  } catch (_err) {
    debugLog('*', `Error reading cache from ${filePath}`);
  }
};

const create = timerify(createCache);

export class FileEntryCache<T> {
  filePath: string;
  cache = new Map<string, MetaData<T>>();
  normalizedEntries = new Map<string, FileDescriptor<T>>();

  constructor(cacheId: string, _path: string) {
    this.filePath = path.resolve(_path, cacheId);
    if (isFile(this.filePath)) this.cache = create(this.filePath);
  }

  getFileDescriptor(filePath: string): FileDescriptor<T> {
    if (!isAbsolute(filePath)) filePath = resolve(filePath);
    const existing = this.normalizedEntries.get(filePath);
    if (existing) return existing;

    let fstat: fs.Stats;
    try {
      fstat = fs.statSync(filePath);
    } catch (error: unknown) {
      this.removeEntry(filePath);
      return { key: filePath, notFound: true, err: error };
    }

    let meta = this.cache.get(filePath);
    const cSize = fstat.size;
    const cTime = fstat.mtime.getTime();

    let changed = false;
    if (meta) {
      if (cTime !== meta.mtime || cSize !== meta.size) {
        changed = true;
        meta.data = undefined;
      }
      meta.mtime = cTime;
      meta.size = cSize;
    } else {
      changed = true;
      meta = { size: cSize, mtime: cTime };
      this.cache.set(filePath, meta);
    }

    const fd: FileDescriptor<T> = { key: filePath, changed, meta };
    this.normalizedEntries.set(filePath, fd);
    return fd;
  }

  removeEntry(entryName: string) {
    if (!isAbsolute(entryName)) entryName = resolve(entryName);
    this.normalizedEntries.delete(entryName);
    this.cache.delete(entryName);
  }

  reconcile() {
    try {
      const dir = dirname(this.filePath);
      if (!isDirectory(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, serialize(this.cache));
    } catch (_err) {
      debugLog('*', `Error writing cache to ${this.filePath}`);
    }
  }
}
