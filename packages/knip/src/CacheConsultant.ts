import { timerify } from './util/Performance.js';
import { type FileDescriptor, FileEntryCache } from './util/file-entry-cache.js';
import { version } from './version.js';

const dummyFileDescriptor: FileDescriptor<any> = { key: '', changed: true, notFound: true };

type CacheOptions = {
  name: string;
  isEnabled: boolean;
  cacheLocation: string;
};

export class CacheConsultant<T> {
  private isEnabled: boolean;
  private cache: undefined | FileEntryCache<T>;

  constructor(options: CacheOptions) {
    this.isEnabled = options.isEnabled;
    if (this.isEnabled) {
      const cacheName = `${options.name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${version}`;
      this.cache = new FileEntryCache(cacheName, options.cacheLocation);
      this.reconcile = timerify(this.cache.reconcile).bind(this.cache);
      this.getFileDescriptor = timerify(this.cache.getFileDescriptor).bind(this.cache);
    }
  }
  public getFileDescriptor(file: string): FileDescriptor<T> {
    if (this.isEnabled && this.cache) return this.cache.getFileDescriptor(file);
    return dummyFileDescriptor;
  }
  public reconcile() {
    if (this.isEnabled && this.cache) this.cache.reconcile();
  }
}
