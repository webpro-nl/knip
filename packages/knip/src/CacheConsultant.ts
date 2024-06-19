import { timerify } from './util/Performance.js';
import parsedArgValues from './util/cli-arguments.js';
import { type FileDescriptor, FileEntryCache } from './util/file-entry-cache.js';
import { cwd, join } from './util/path.js';
import { version } from './version.js';

const defaultCacheLocation = join(cwd, 'node_modules', '.cache', 'knip');

const { cache: isCache = false, watch: isWatch = false } = parsedArgValues;

const cacheLocation = parsedArgValues['cache-location'] ?? defaultCacheLocation;

// biome-ignore lint/suspicious/noExplicitAny: deal with it
const dummyFileDescriptor: FileDescriptor<any> = { key: '', changed: true, notFound: true };

const isEnabled = isCache || isWatch;

export class CacheConsultant<T> {
  private cache: undefined | FileEntryCache<T>;
  constructor(name: string) {
    if (isCache) {
      const cacheName = `${name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${version}`;
      this.cache = new FileEntryCache(cacheName, cacheLocation);
      this.reconcile = timerify(this.cache.reconcile).bind(this.cache);
      this.getFileDescriptor = timerify(this.cache.getFileDescriptor).bind(this.cache);
    }
  }
  static getCacheLocation() {
    return cacheLocation;
  }
  public getFileDescriptor(file: string): FileDescriptor<T> {
    if (isEnabled && this.cache) return this.cache?.getFileDescriptor(file);
    return dummyFileDescriptor;
  }
  public reconcile() {
    if (isEnabled && this.cache) this.cache.reconcile();
  }
}
