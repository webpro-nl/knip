import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Compilers } from '../compilers/types.ts';
import { FOREIGN_FILE_EXTENSIONS } from '../constants.ts';
import { debugLog } from '../util/debug.ts';
import { CompilerError, ConfigurationError } from '../util/errors.ts';
import { extname, isInternal } from '../util/path.ts';

interface SourceFileManagerOptions {
  compilers: Compilers;
  isSession?: boolean;
}

export class SourceFileManager {
  sourceTextCache = new Map<string, string | Promise<string>>();
  compilers: Compilers;
  private rawContentHashes = new Map<string, string>();
  private isSession: boolean;

  constructor({ compilers, isSession = false }: SourceFileManagerOptions) {
    this.compilers = compilers;
    this.isSession = isSession;
  }

  loadSourceText(filePath: string): string | Promise<string> {
    const cachedSourceText = this.sourceTextCache.get(filePath);
    if (cachedSourceText !== undefined) return cachedSourceText;
    const ext = extname(filePath);
    const compiler = this.compilers.get(ext);
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
    if (!compiler) return this.cacheSourceText(filePath, contents, contents);

    let result;
    try {
      result = compiler(contents, filePath);
      if (result !== null && (typeof result === 'object' || typeof result === 'function')) {
        const pending = Promise.resolve(result).then(
          result => {
            const isCurrent = this.sourceTextCache.get(filePath) === pending;
            if (isCurrent) this.sourceTextCache.delete(filePath);
            const sourceText = this.validateCompilerResult(result, filePath, ext);
            if (isCurrent) this.cacheSourceText(filePath, sourceText, contents);
            debugLog('*', `Compiled ${filePath}`);
            return sourceText;
          },
          cause => {
            if (this.sourceTextCache.get(filePath) === pending) this.sourceTextCache.delete(filePath);
            throw new CompilerError(`Compiler for ${ext} failed (${filePath})`, { cause });
          }
        );
        this.sourceTextCache.set(filePath, pending);
        return pending;
      }
    } catch (cause) {
      throw new CompilerError(`Compiler for ${ext} failed (${filePath})`, { cause });
    }
    const sourceText = this.validateCompilerResult(result, filePath, ext);
    debugLog('*', `Compiled ${filePath}`);
    return this.cacheSourceText(filePath, sourceText, contents);
  }

  invalidate(filePath: string) {
    this.sourceTextCache.delete(filePath);
    this.rawContentHashes.delete(filePath);
  }

  hasChanged(filePath: string): boolean {
    const previousHash = this.rawContentHashes.get(filePath);
    if (previousHash === undefined) return true;
    const contents = this.readRawFile(filePath);
    return contents === undefined || createHash('sha1').update(contents).digest('hex') !== previousHash;
  }

  readRawFile(filePath: string): string | undefined {
    try {
      return readFileSync(filePath, 'utf8');
    } catch {
      return undefined;
    }
  }

  private cacheSourceText(filePath: string, sourceText: string, contents: string): string {
    this.sourceTextCache.set(filePath, sourceText);
    if (this.isSession) this.rawContentHashes.set(filePath, createHash('sha1').update(contents).digest('hex'));
    return sourceText;
  }

  private validateCompilerResult(result: unknown, filePath: string, ext: string): string {
    if (typeof result === 'string') return result;
    const category = result === null ? 'null' : typeof result;
    throw new ConfigurationError(
      `Compiler for ${ext} returned ${category} for ${filePath}; expected a string or PromiseLike<string>`
    );
  }
}
