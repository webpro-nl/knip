import type { MainOptions } from './util/create-options.ts';
import { type FileDescriptor, FileEntryCache } from './util/file-entry-cache.ts';
import { timerify } from './util/Performance.ts';
import { version } from './version.ts';

const dummyFileDescriptor: FileDescriptor<any> = { key: '', changed: true, notFound: true };

export class CacheConsultant<T> {
  private cache: FileEntryCache<T> | undefined;
  getFileDescriptor: (filePath: string) => FileDescriptor<T> = () => dummyFileDescriptor;
  reconcile: () => void = () => {};
  removeEntry: (filePath: string) => void = () => {};
  setData: (filePath: string, data: T) => void = () => {};

  constructor(name: string, options: MainOptions, fingerprint?: string) {
    if (!options.isCache) return;
    const mode = `${options.isProduction ? '-prod' : ''}${options.isStrict ? '-strict' : ''}`;
    const cacheName = `${name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${mode}-${version}`;
    this.cache = new FileEntryCache(cacheName, options.cacheLocation, fingerprint);
    this.getFileDescriptor = timerify(this.cache.getFileDescriptor.bind(this.cache));
    this.reconcile = timerify(this.cache.reconcile.bind(this.cache));
    this.removeEntry = timerify(this.cache.removeEntry.bind(this.cache));
    const cache = this.cache;
    this.setData = (filePath, data) => {
      const fd = cache.getFileDescriptor(filePath);
      if (!fd.meta) return;
      fd.meta.data = data;
      cache.isDirty = true;
    };
  }

  getCachedFile(filePath: string, isValid?: (data: T) => boolean): T | undefined {
    if (!this.cache) return undefined;
    const fd = this.cache.getFileDescriptor(filePath);
    if (fd.changed || !fd.meta?.data) return undefined;
    if (isValid && !isValid(fd.meta.data)) {
      fd.changed = true;
      fd.meta.data = undefined;
      this.cache.isDirty = true;
      return undefined;
    }
    return fd.meta.data;
  }
}
