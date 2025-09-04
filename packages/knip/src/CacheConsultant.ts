import { timerify } from './util/Performance.js';
import type { MainOptions } from './util/create-options.js';
import { type FileDescriptor, FileEntryCache } from './util/file-entry-cache.js';
import { version } from './version.js';

const dummyFileDescriptor: FileDescriptor<any> = { key: '', changed: true, notFound: true };

export class CacheConsultant<T> {
  private isEnabled: boolean;
  private cache: undefined | FileEntryCache<T>;

  constructor(name: string, options: MainOptions) {
    this.isEnabled = options.isCache;
    if (this.isEnabled) {
      const cacheName = `${name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${options.isProduction ? '-prod' : ''}-${version}`;
      this.cache = new FileEntryCache(cacheName, options.cacheLocation);
      this.reconcile = timerify(this.cache.reconcile).bind(this.cache);
      this.getFileDescriptor = timerify(this.cache.getFileDescriptor).bind(this.cache);
    }
  }
  public getFileDescriptor(filePath: string): FileDescriptor<T> {
    if (this.isEnabled && this.cache) return this.cache.getFileDescriptor(filePath);
    return dummyFileDescriptor;
  }
  public reconcile() {
    if (this.isEnabled && this.cache) this.cache.reconcile();
  }
}
