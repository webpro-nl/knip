import { readFileSync } from 'node:fs';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.ts';
import { FOREIGN_FILE_EXTENSIONS } from '../constants.ts';
import { debugLog } from '../util/debug.ts';
import { extname, isInternal } from '../util/path.ts';

interface SourceFileManagerOptions {
  compilers: [SyncCompilers, AsyncCompilers];
}

export class SourceFileManager {
  sourceTextCache = new Map<string, string>();
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;

  constructor({ compilers }: SourceFileManagerOptions) {
    this.syncCompilers = compilers[0];
    this.asyncCompilers = compilers[1];
  }

  readFile(filePath: string): string {
    if (this.sourceTextCache.has(filePath)) return this.sourceTextCache.get(filePath)!;
    const ext = extname(filePath);
    const compiler = this.syncCompilers.get(ext);
    if (FOREIGN_FILE_EXTENSIONS.has(ext) && !compiler) {
      this.sourceTextCache.set(filePath, '');
      return '';
    }
    const contents = this.readRawFile(filePath);
    if (contents === undefined) {
      if (isInternal(filePath)) debugLog('*', `Unable to read ${filePath}`);
      this.sourceTextCache.set(filePath, '');
      return '';
    }
    const compiled = compiler ? compiler(contents, filePath) : contents;
    if (compiler) debugLog('*', `Compiled ${filePath}`);
    this.sourceTextCache.set(filePath, compiled);
    return compiled;
  }

  invalidate(filePath: string) {
    this.sourceTextCache.delete(filePath);
  }

  async compileAndAddSourceFile(filePath: string) {
    const contents = this.readRawFile(filePath);
    if (contents === undefined) throw new Error(`Unable to read ${filePath}`);
    const ext = extname(filePath);
    const compiler = this.asyncCompilers.get(ext);
    if (compiler) {
      const compiled = await compiler(contents, filePath);
      debugLog('*', `Compiled ${filePath}`);
      this.sourceTextCache.set(filePath, compiled);
    }
  }

  private readRawFile(filePath: string): string | undefined {
    try {
      return readFileSync(filePath, 'utf8');
    } catch {
      return undefined;
    }
  }
}
