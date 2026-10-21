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
import { FileEntryCacheStorage } from './file-entry-cache-storage.ts';
import { isDirectory, isFile } from './fs.ts';
import { timerify } from './Performance.ts';
import { isAbsolute, resolve } from './path.ts';

type MetaData<T> = { size: number; mtime: number; data?: T };

export type CacheDependencies = { paths: string[]; files: string[]; fingerprint: string };

export type CacheEnvelope<T> = {
  version: 1;
  context: string;
  entries: Map<string, MetaData<T>>;
  dependencies?: CacheDependencies;
  removed?: string[];
};

export type CacheSerializer<T> = (cache: Map<string, MetaData<T>> | CacheEnvelope<T>) => Uint8Array;

export type FileDescriptor<T> = {
  key: string;
  changed?: boolean;
  notFound?: boolean;
  err?: unknown;
  meta?: MetaData<T>;
};

const createCache = (filePath: string, storage?: FileEntryCacheStorage<unknown>): unknown => {
  try {
    return storage ? storage.read(filePath) : deserialize(fs.readFileSync(filePath));
  } catch (_err) {
    debugLog('*', `Error reading cache from ${filePath}`);
  }
};

const create = timerify(createCache);

const readDependencies = (value: unknown): CacheDependencies | undefined => {
  if (
    value &&
    typeof value === 'object' &&
    'fingerprint' in value &&
    typeof value.fingerprint === 'string' &&
    'paths' in value &&
    Array.isArray(value.paths) &&
    value.paths.every(path => typeof path === 'string') &&
    'files' in value &&
    Array.isArray(value.files) &&
    value.files.every(path => typeof path === 'string')
  )
    return { paths: value.paths, files: value.files, fingerprint: value.fingerprint };
};

export class FileEntryCache<T> {
  filePath: string;
  cache = new Map<string, MetaData<T>>();
  normalizedEntries = new Map<string, FileDescriptor<T>>();
  private serializeCache: CacheSerializer<T>;
  private immutable: boolean;
  private context: string | undefined;
  private dependencies: CacheDependencies | undefined;
  private dirty = true;
  private storage: FileEntryCacheStorage<T> | undefined;
  private changedEntries = new Set<string>();
  private removedEntries = new Set<string>();
  private dependenciesChanged = true;
  private replace = true;

  constructor(
    cacheId: string,
    _path: string,
    serializeCache: CacheSerializer<T> = serialize,
    immutable = false,
    context?: string,
    validateDependencies?: (dependencies: CacheDependencies | undefined) => boolean,
    incremental = false
  ) {
    this.filePath = path.resolve(_path, cacheId);
    this.serializeCache = serializeCache;
    this.immutable = immutable;
    this.context = context;
    if (incremental && immutable && context !== undefined) this.storage = new FileEntryCacheStorage();
    if (isFile(this.filePath)) {
      const data = create(this.filePath, this.storage);
      if (context === undefined && data instanceof Map) {
        this.cache = data;
        this.dirty = false;
      } else if (
        context !== undefined &&
        data &&
        typeof data === 'object' &&
        'version' in data &&
        data.version === 1 &&
        'context' in data &&
        data.context === context &&
        'entries' in data &&
        data.entries instanceof Map
      ) {
        const dependencies = 'dependencies' in data ? readDependencies(data.dependencies) : undefined;
        if (!validateDependencies || validateDependencies(dependencies)) {
          this.cache = data.entries;
          this.dependencies = dependencies;
          this.dirty = false;
          this.dependenciesChanged = false;
          this.replace = false;
        }
      }
    }
  }

  get isClean() {
    return this.immutable && !this.dirty;
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

    if (changed) {
      this.dirty = true;
      this.changedEntries.add(filePath);
    }
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
      this.changedEntries.add(fd.key);
    }
    fd.changed = false;
  }

  removeEntry(entryName: string) {
    if (!isAbsolute(entryName)) entryName = resolve(entryName);
    this.normalizedEntries.delete(entryName);
    if (this.cache.delete(entryName)) {
      this.dirty = true;
      this.changedEntries.delete(entryName);
      this.removedEntries.add(entryName);
    }
  }

  clear() {
    this.normalizedEntries.clear();
    if (this.cache.size > 0) {
      this.cache.clear();
      this.dirty = true;
      this.replace = true;
      this.changedEntries.clear();
      this.removedEntries.clear();
    }
    this.setDependencies(undefined);
  }

  getDependencies() {
    return this.dependencies;
  }

  setDependencies(dependencies: CacheDependencies | undefined) {
    if (
      this.dependencies?.fingerprint === dependencies?.fingerprint &&
      this.dependencies?.paths.length === dependencies?.paths.length &&
      this.dependencies?.files.length === dependencies?.files.length &&
      !dependencies?.paths.some((path, index) => path !== this.dependencies?.paths[index]) &&
      !dependencies?.files.some((path, index) => path !== this.dependencies?.files[index])
    )
      return;
    this.dependencies = dependencies && {
      paths: [...dependencies.paths],
      files: [...dependencies.files],
      fingerprint: dependencies.fingerprint,
    };
    this.dirty = true;
    this.dependenciesChanged = true;
  }

  reconcile() {
    if (this.immutable && !this.dirty) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!isDirectory(dir)) fs.mkdirSync(dir, { recursive: true });
      const value: Map<string, MetaData<T>> | CacheEnvelope<T> =
        this.context === undefined
          ? this.cache
          : { version: 1, context: this.context, entries: this.cache, dependencies: this.dependencies };
      if (this.storage && !(value instanceof Map))
        this.storage.write(
          this.filePath,
          value,
          this.changedEntries,
          this.removedEntries,
          this.dependenciesChanged,
          this.replace,
          this.serializeCache
        );
      else fs.writeFileSync(this.filePath, this.serializeCache(value));
      this.dirty = false;
      this.replace = false;
      this.dependenciesChanged = false;
      this.changedEntries.clear();
      this.removedEntries.clear();
    } catch (_err) {
      debugLog('*', `Error writing cache to ${this.filePath}`);
    }
  }
}
