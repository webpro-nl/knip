/**
 * Credits for this idea go to file-entry-cache, this is a modified and simplified version.
 * - https://github.com/jaredwray/cacheable/blob/main/packages/file-entry-cache/README.md
 * - https://github.com/jaredwray/cacheable/blob/main/packages/file-entry-cache/LICENSE
 */
import fs from 'node:fs';
// biome-ignore lint/nursery/noRestrictedImports: ignore
import path from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { timerify } from './Performance.js';
import { debugLog } from './debug.js';
import { isDirectory, isFile } from './fs.js';
import { cwd, dirname, isAbsolute, resolve } from './path.js';

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
    this.filePath = isAbsolute(_path) ? path.resolve(_path, cacheId) : path.resolve(cwd, _path, cacheId);
    if (isFile(this.filePath)) this.cache = create(this.filePath);
    this.removeNotFoundFiles();
  }

  removeNotFoundFiles() {
    for (const filePath of this.normalizedEntries.keys()) {
      try {
        fs.statSync(filePath);
      } catch (error) {
        // @ts-expect-error
        if (error.code === 'ENOENT') this.cache.delete(filePath);
      }
    }
  }

  getFileDescriptor(filePath: string): FileDescriptor<T> {
    let fstat: fs.Stats;

    try {
      if (!isAbsolute(filePath)) filePath = resolve(filePath);
      fstat = fs.statSync(filePath);
    } catch (error: unknown) {
      this.removeEntry(filePath);
      return { key: filePath, notFound: true, err: error };
    }

    return this._getFileDescriptorUsingMtimeAndSize(filePath, fstat);
  }

  _getFileDescriptorUsingMtimeAndSize(filePath: string, fstat: fs.Stats) {
    let meta = this.cache.get(filePath);
    const cacheExists = Boolean(meta);

    const cSize = fstat.size;
    const cTime = fstat.mtime.getTime();

    let isDifferentDate: undefined | boolean;
    let isDifferentSize: undefined | boolean;

    if (meta) {
      isDifferentDate = cTime !== meta.mtime;
      isDifferentSize = cSize !== meta.size;
    } else {
      meta = { size: cSize, mtime: cTime };
    }

    const fd: FileDescriptor<T> = {
      key: filePath,
      changed: !cacheExists || isDifferentDate || isDifferentSize,
      meta,
    };

    this.normalizedEntries.set(filePath, fd);

    return fd;
  }

  removeEntry(entryName: string) {
    if (!isAbsolute(entryName)) entryName = resolve(cwd, entryName);
    this.normalizedEntries.delete(entryName);
    this.cache.delete(entryName);
  }

  _getMetaForFileUsingMtimeAndSize(cacheEntry: FileDescriptor<T>) {
    const stat = fs.statSync(cacheEntry.key);
    const meta = Object.assign(cacheEntry.meta ?? {}, {
      size: stat.size,
      mtime: stat.mtime.getTime(),
    });
    return meta;
  }

  reconcile() {
    this.removeNotFoundFiles();

    for (const [entryName, cacheEntry] of this.normalizedEntries.entries()) {
      try {
        const meta = this._getMetaForFileUsingMtimeAndSize(cacheEntry);
        this.cache.set(entryName, meta);
      } catch (error) {
        // @ts-expect-error
        if (error.code !== 'ENOENT') throw error;
      }
    }

    try {
      const dir = dirname(this.filePath);
      if (!isDirectory(dir)) fs.mkdirSync(dir, { recursive: true });
      // @ts-ignore please bun
      fs.writeFileSync(this.filePath, serialize(this.cache));
    } catch (_err) {
      debugLog('*', `Error writing cache to ${this.filePath}`);
    }
  }
}
