import fileEntryCache, { type FileEntryCache, type FileDescriptor } from 'file-entry-cache';
import { timerify } from './util/Performance.js';
import parsedArgValues from './util/cli-arguments.js';
import { cwd, join } from './util/path.js';

const defaultCacheLocation = join(cwd, 'node_modules', '.cache', 'knip');

const { cache: isCache = false, watch: isWatch = false } = parsedArgValues;

const cacheLocation = parsedArgValues['cache-location'] ?? defaultCacheLocation;

interface FD<T> extends FileDescriptor {
  readonly meta?: {
    readonly size?: number;
    readonly mtime?: number;
    readonly hash?: string;
    data?: T;
  };
}

const create = timerify(fileEntryCache.create, 'createCache');

const dummyFileDescriptor = { key: '', changed: true, notFound: true, meta: undefined };

const isEnabled = isCache || isWatch;

const version = '3';

export class CacheConsultant<T> {
  private cache: undefined | FileEntryCache;
  constructor(name: string) {
    if (isCache) {
      const cacheName = `${name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${version}`;
      this.cache = create(cacheName, cacheLocation);
      this.reconcile = timerify(this.cache.reconcile).bind(this.cache);
      this.getFileDescriptor = timerify(this.cache.getFileDescriptor).bind(this.cache);
    }
  }
  static getCacheLocation() {
    return cacheLocation;
  }
  public getFileDescriptor(file: string): FD<T> {
    if (isEnabled && this.cache) return this.cache?.getFileDescriptor(file);
    return dummyFileDescriptor;
  }
  public reconcile() {
    if (isEnabled && this.cache) this.cache.reconcile();
  }
}
