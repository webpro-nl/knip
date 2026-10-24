import { createHash } from 'node:crypto';
import type { MainOptions } from './util/create-options.ts';
import { type FileDescriptor, FileEntryCache } from './util/file-entry-cache.ts';
import { timerify } from './util/Performance.ts';
import { version } from './version.ts';

const dummyFileDescriptor = { key: '', changed: true, notFound: true };

export class CacheConsultant<T> {
  private cache: FileEntryCache<T> | undefined;
  getFileDescriptor: (filePath: string) => FileDescriptor<T> = () => dummyFileDescriptor;
  reconcile: () => void = () => {};
  removeEntry: (filePath: string) => void = () => {};
  setFileData: (filePath: string, data: T) => void = () => {};

  constructor(name: string, options: MainOptions, context?: string) {
    if (!options.isCache) return;
    const cacheName = `${name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${options.isProduction ? '-prod' : ''}-${version}`;
    this.cache = new FileEntryCache(
      cacheName,
      options.cacheLocation,
      context === undefined ? undefined : createHash('sha256').update(context).digest('hex')
    );
    this.getFileDescriptor = timerify(this.cache.getFileDescriptor.bind(this.cache));
    this.reconcile = timerify(this.cache.reconcile.bind(this.cache));
    this.removeEntry = timerify(this.cache.removeEntry.bind(this.cache));
    this.setFileData = this.cache.setFileData.bind(this.cache);
  }

  getCachedFile(filePath: string): T | undefined {
    if (!this.cache) return undefined;
    const fd = this.cache.getFileDescriptor(filePath);
    return !fd.changed ? fd.meta?.data : undefined;
  }
}
