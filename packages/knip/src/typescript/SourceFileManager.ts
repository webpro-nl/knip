import { readFileSync } from 'node:fs';
import type { AsyncCompilers, CompilerSync } from '../compilers/types.ts';
import { FOREIGN_FILE_EXTENSIONS } from '../constants.ts';
import { debugLog } from '../util/debug.ts';
import { extname, isInternal } from '../util/path.ts';

interface SourceFileManagerOptions {
  asyncCompilers: AsyncCompilers;
  getSyncCompiler: (ext: string, filePath: string) => CompilerSync | undefined;
}

export class SourceFileManager {
  sourceTextCache = new Map<string, string>();
  asyncCompilers: AsyncCompilers;
  getSyncCompiler: SourceFileManagerOptions['getSyncCompiler'];

  constructor({ asyncCompilers, getSyncCompiler }: SourceFileManagerOptions) {
    this.asyncCompilers = asyncCompilers;
    this.getSyncCompiler = getSyncCompiler;
  }

  readFile(filePath: string): string {
    const cachedSourceText = this.sourceTextCache.get(filePath);
    if (cachedSourceText !== undefined) return cachedSourceText;
    const ext = extname(filePath);
    const compiler = this.getSyncCompiler(ext, filePath);
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
