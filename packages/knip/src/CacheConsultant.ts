import { createHash } from 'node:crypto';
import { createNativeFile, getNativeFileData } from './native-analyzer.ts';
import type { NativeFileCompact } from './native-analyzer-wire.ts';
import type { FileNode } from './types/module-graph.ts';
import type { MainOptions } from './util/create-options.ts';
import {
  type CacheDependencies,
  type CacheSerializer,
  type FileDescriptor,
  FileEntryCache,
} from './util/file-entry-cache.ts';
import { timerify } from './util/Performance.ts';
import { serializeGraphCache } from './util/serialize-graph-cache.ts';
import { version } from './version.ts';

const dummyFileDescriptor = { key: '', changed: true, notFound: true };

export class CacheConsultant<T> {
  private cache: FileEntryCache<T> | undefined;
  getFileDescriptor: (filePath: string) => FileDescriptor<T> = () => dummyFileDescriptor;
  reconcile: () => void = () => {};
  removeEntry: (filePath: string) => void = () => {};

  constructor(
    name: string,
    options: MainOptions,
    serializeCache?: CacheSerializer<T>,
    immutable = false,
    context?: string,
    validateDependencies?: (dependencies: CacheDependencies | undefined) => boolean,
    incremental = false
  ) {
    if (!options.isCache) return;
    const cacheName = `${name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${options.isProduction ? '-prod' : ''}-${version}`;
    this.cache = new FileEntryCache(
      cacheName,
      options.cacheLocation,
      serializeCache,
      immutable,
      context,
      validateDependencies,
      incremental
    );
    this.getFileDescriptor = timerify(this.cache.getFileDescriptor.bind(this.cache));
    this.reconcile = timerify(this.cache.reconcile.bind(this.cache));
    this.removeEntry = timerify(this.cache.removeEntry.bind(this.cache));
  }

  get isClean() {
    return this.cache?.isClean ?? false;
  }

  getCachedFile(filePath: string): T | undefined {
    if (!this.cache) return undefined;
    const fd = this.cache.getFileDescriptor(filePath);
    return !fd.changed ? fd.meta?.data : undefined;
  }

  setCachedFile(filePath: string, data: T) {
    this.cache?.setFileData(filePath, data);
  }

  clear() {
    this.cache?.clear();
  }

  getDependencies() {
    return this.cache?.getDependencies();
  }

  setDependencies(dependencies: CacheDependencies) {
    this.cache?.setDependencies(dependencies);
  }
}

type GraphCacheRecord = { kind: 'native'; file: NativeFileCompact } | { kind: 'graph'; file: FileNode };

export class GraphCacheConsultant {
  private cache: CacheConsultant<GraphCacheRecord> | undefined;
  private options: MainOptions;
  private context: string | undefined;
  private fingerprint: ((paths: string[], files: string[]) => string | undefined) | undefined;
  private valid = true;
  private dependenciesValidated = false;
  private closed = false;

  constructor(options: MainOptions) {
    this.options = options;
  }

  setContext(context: string, fingerprint?: (paths: string[], files: string[]) => string | undefined) {
    if (this.closed || !this.options.isCache) return;
    const key = createHash('sha256').update(context).digest('hex');
    if (this.context === key && this.fingerprint === fingerprint) return;
    this.context = key;
    this.fingerprint = fingerprint;
    this.valid = true;
    this.dependenciesValidated = false;
    this.cache = new CacheConsultant<GraphCacheRecord>(
      'root-analysis-v3',
      this.options,
      serializeGraphCache,
      true,
      key,
      fingerprint
        ? dependencies => {
            this.dependenciesValidated =
              !!dependencies &&
              this.getFingerprint(dependencies.paths, dependencies.files) === dependencies.fingerprint;
            return this.dependenciesValidated;
          }
        : undefined,
      true
    );
  }

  closeIfUnchanged(): boolean {
    if (!this.valid || !this.dependenciesValidated || !this.cache?.isClean) return false;
    this.close();
    return true;
  }

  close(): void {
    this.closed = true;
    this.valid = false;
    this.dependenciesValidated = false;
    this.cache = undefined;
    this.context = undefined;
    this.fingerprint = undefined;
  }

  private getFingerprint(paths: string[], files: string[]) {
    try {
      return this.fingerprint?.(paths, files);
    } catch {
      return undefined;
    }
  }

  getCachedFile(filePath: string, includeInternal = true): FileNode | undefined {
    if (!this.valid) return;
    const record = this.cache?.getCachedFile(filePath);
    if (record) {
      try {
        if (record.kind === 'native') return createNativeFile(record.file, undefined, includeInternal);
        if (record.kind === 'graph') return structuredClone(record.file);
      } catch {}
      this.cache?.removeEntry(filePath);
    }
  }

  setCachedFile(filePath: string, file: FileNode): FileNode {
    if (this.cache && this.valid) {
      const compact = getNativeFileData(file);
      this.cache.setCachedFile(
        filePath,
        compact ? { kind: 'native', file: compact } : { kind: 'graph', file: structuredClone(file) }
      );
    }
    return file;
  }

  removeEntry(filePath: string) {
    this.cache?.removeEntry(filePath);
  }

  invalidate() {
    this.cache?.clear();
  }

  reconcile(dependencies?: { paths: string[]; files: string[]; complete: boolean }) {
    if (this.cache && this.fingerprint && this.valid) {
      const previous = this.cache.getDependencies();
      const paths = new Set(previous?.paths);
      const files = new Set(previous?.files);
      if (dependencies) {
        for (const path of dependencies.paths) paths.add(path);
        for (const file of dependencies.files) files.add(file);
      }
      const mergedPaths = [...paths];
      const mergedFiles = [...files];
      const fingerprint = dependencies?.complete ? this.getFingerprint(mergedPaths, mergedFiles) : undefined;
      const previousFingerprint =
        previous && (paths.size !== previous.paths.length || files.size !== previous.files.length)
          ? this.getFingerprint(previous.paths, previous.files)
          : fingerprint;
      if (fingerprint === undefined || (previous && previousFingerprint !== previous.fingerprint)) {
        this.valid = false;
        this.cache.clear();
        this.cache.reconcile();
        return;
      }
      this.cache.setDependencies({ paths: mergedPaths, files: mergedFiles, fingerprint });
    }
    this.cache?.reconcile();
  }
}
