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
import { isAbsolute, resolve } from './path.ts';

type MetaData<T> = { size: number; mtime: number; ctime: number; ino: number; context?: string; data?: T };

export type FileDescriptor<T> = {
  key: string;
  changed?: boolean;
  notFound?: boolean;
  err?: unknown;
  meta?: MetaData<T>;
};

const createCache = (filePath: string): unknown => {
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
  private dirty = false;
  private context: string | undefined;

  constructor(cacheId: string, _path: string, context?: string) {
    this.filePath = path.resolve(_path, cacheId);
    this.context = context;
    if (isFile(this.filePath)) {
      const restored = create(this.filePath);
      if (restored instanceof Map) this.cache = restored;
    }
  }

  getFileDescriptor(filePath: string): FileDescriptor<T> {
    if (!isAbsolute(filePath)) filePath = resolve(filePath);
    const existing = this.normalizedEntries.get(filePath);
    if (existing) return existing;

    let fstat: fs.Stats | undefined;
    try {
      fstat = fs.statSync(filePath, { throwIfNoEntry: false });
    } catch (error: unknown) {
      this.removeEntry(filePath);
      return { key: filePath, notFound: true, err: error };
    }
    if (!fstat) {
      this.removeEntry(filePath);
      return { key: filePath, notFound: true };
    }

    let meta = this.cache.get(filePath);
    if (meta && (typeof meta !== 'object' || !Number.isFinite(meta.size) || !Number.isFinite(meta.mtime))) {
      this.removeEntry(filePath);
      meta = undefined;
    }
    const cSize = fstat.size;
    const cTime = fstat.mtimeMs;

    let changed = false;
    if (meta) {
      if (
        cTime !== meta.mtime ||
        cSize !== meta.size ||
        fstat.ctimeMs !== meta.ctime ||
        fstat.ino !== meta.ino ||
        this.context !== meta.context
      ) {
        changed = true;
        meta.data = undefined;
      }
      meta.mtime = cTime;
      meta.size = cSize;
      meta.ctime = fstat.ctimeMs;
      meta.ino = fstat.ino;
      meta.context = this.context;
    } else {
      changed = true;
      meta = { size: cSize, mtime: cTime, ctime: fstat.ctimeMs, ino: fstat.ino, context: this.context };
      this.cache.set(filePath, meta);
    }

    if (changed) this.dirty = true;
    const fd: FileDescriptor<T> = { key: filePath, changed, meta };
    this.normalizedEntries.set(filePath, fd);
    return fd;
  }

  setFileData(filePath: string, data: T) {
    const fd = this.getFileDescriptor(filePath);
    if (!fd.meta) return;
    if (fd.meta.data !== data) {
      fd.meta.data = data;
      this.dirty = true;
    }
    fd.changed = false;
  }

  removeEntry(entryName: string) {
    if (!isAbsolute(entryName)) entryName = resolve(entryName);
    this.normalizedEntries.delete(entryName);
    if (this.cache.delete(entryName)) this.dirty = true;
  }

  reconcile() {
    for (const filePath of this.cache.keys()) {
      if (!this.normalizedEntries.has(filePath)) this.removeEntry(filePath);
    }
    if (!this.dirty) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!isDirectory(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, serialize(this.cache));
      this.dirty = false;
    } catch (_err) {
      debugLog('*', `Error writing cache to ${this.filePath}`);
    }
  }
}
