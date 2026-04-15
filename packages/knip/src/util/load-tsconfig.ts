import { readFileSync } from 'node:fs';
import { parseTsconfig } from 'get-tsconfig';
import stripJsonComments from 'strip-json-comments';
import type { CompilerOptions } from '../types/project.ts';
import { isFile as _isFile } from './fs.ts';
import { _syncGlob } from './glob.ts';
import { dirname, isAbsolute, join, toAbsolute } from './path.ts';

const hasGlobChar = (p: string) => p.includes('*') || p.includes('?');
const hasExtension = (p: string) => {
  const last = p.lastIndexOf('/');
  const base = last >= 0 ? p.slice(last + 1) : p;
  return base !== '.' && base !== '..' && base.includes('.');
};

const resolvePatterns = (patterns: string[] | undefined, dir: string, expandDirs = false): string[] | undefined => {
  if (!patterns) return undefined;
  return patterns.map(p => {
    const resolved = isAbsolute(p) ? p : join(dir, p);
    return expandDirs && !hasGlobChar(p) && !hasExtension(p) ? join(resolved, '**/*') : resolved;
  });
};

const DEFAULT_INCLUDE = ['**/*'];

const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const isDtsExt = /\.d\.(m|c)?ts$/;
const isTsRelevant = (filePath: string) => {
  if (isDtsExt.test(filePath)) return true;
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  return TS_EXTENSIONS.has(ext);
};

const expandFileNames = (
  dir: string,
  compilerOptions: CompilerOptions,
  include?: string[],
  exclude?: string[],
  files?: string[]
): string[] => {
  const result: string[] = [];

  if (files) {
    for (const file of files) result.push(file);
  }

  const effectiveExclude = [...(exclude ?? []), join(dir, 'node_modules/**')];
  if (compilerOptions.outDir) {
    effectiveExclude.push(join(compilerOptions.outDir, '**'));
  }

  const effectiveInclude = include ?? (files ? undefined : DEFAULT_INCLUDE.map(p => join(dir, p)));
  if (effectiveInclude) {
    const negated = effectiveExclude.map(p => `!${p}`);
    const globbed = _syncGlob({ patterns: [...effectiveInclude, ...negated], cwd: dir });
    for (const f of globbed) if (isTsRelevant(f)) result.push(f);
  }

  return result;
};

const findRootDirsBase = (tsConfigFilePath: string): string | undefined => {
  try {
    const raw = JSON.parse(stripJsonComments(readFileSync(tsConfigFilePath, 'utf8')));
    if (raw.compilerOptions?.rootDirs) return dirname(tsConfigFilePath);
    if (raw.extends) {
      const extPath = join(dirname(tsConfigFilePath), raw.extends);
      return findRootDirsBase(extPath);
    }
  } catch {}
  return undefined;
};

const resolveConfig = (tsConfigFilePath: string) => {
  try {
    return parseTsconfig(tsConfigFilePath);
  } catch {
    try {
      const raw = readFileSync(tsConfigFilePath, 'utf8');
      return JSON.parse(stripJsonComments(raw));
    } catch {
      return undefined;
    }
  }
};

export const loadTSConfig = async (tsConfigFilePath: string) => {
  if (_isFile(tsConfigFilePath)) {
    const config = resolveConfig(tsConfigFilePath);
    if (!config) return { isFile: true, compilerOptions: {} as CompilerOptions, fileNames: [] as string[] };

    const dir = dirname(tsConfigFilePath);
    const compilerOptions = (config.compilerOptions ?? {}) as CompilerOptions;

    if (compilerOptions.outDir) compilerOptions.outDir = toAbsolute(compilerOptions.outDir, dir).replace(/\/+$/, '');
    if (compilerOptions.rootDir) compilerOptions.rootDir = toAbsolute(compilerOptions.rootDir, dir).replace(/\/+$/, '');
    if (compilerOptions.paths) {
      compilerOptions.pathsBasePath ??= dir;
    }
    if (compilerOptions.rootDirs) {
      const rootDirsBase = findRootDirsBase(tsConfigFilePath) ?? dir;
      compilerOptions.rootDirs = compilerOptions.rootDirs.map((d: string) =>
        isAbsolute(d) ? d : join(rootDirsBase, d)
      );
    }

    const include = resolvePatterns(config.include, dir, true);
    const exclude = resolvePatterns(config.exclude, dir, true);
    const files = resolvePatterns(config.files, dir);
    const fileNames = expandFileNames(dir, compilerOptions, include, exclude, files);

    return { isFile: true, compilerOptions, fileNames };
  }
  return { isFile: false, compilerOptions: {} as CompilerOptions, fileNames: [] as string[] };
};
