import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';
import type { SourceMap } from '../types/config.ts';
import type { CompilerOptions } from '../types/project.ts';
import { isFile } from './fs.ts';
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

const resolveReference = (refPath: string, dir: string): string | undefined => {
  const abs = isAbsolute(refPath) ? refPath : join(dir, refPath);
  if (isFile(abs)) return abs;
  const withTsconfig = join(abs, 'tsconfig.json');
  return isFile(withTsconfig) ? withTsconfig : undefined;
};

const absDir = (path: string, dir: string) => toAbsolute(path, dir).replace(/\/+$/, '');

const walkReferences = (
  target: CompilerOptions,
  references: TsConfigJsonResolved['references'],
  dir: string,
  visited: Set<string>,
  pairs: SourceMap[]
) => {
  if (!references?.length) return;
  for (const ref of references) {
    const refPath = resolveReference(ref.path, dir);
    if (!refPath || visited.has(refPath)) continue;
    visited.add(refPath);
    const refConfig = parseTsconfig(refPath);
    const refDir = dirname(refPath);
    const refOpts = refConfig.compilerOptions;
    const refOutDir = refOpts?.outDir ? absDir(refOpts.outDir, refDir) : undefined;
    const refRootDir = refOpts?.rootDir ? absDir(refOpts.rootDir, refDir) : undefined;
    if (refOutDir && refRootDir && refOutDir !== refRootDir) pairs.push({ srcDir: refRootDir, outDir: refOutDir });
    if (refOutDir && !target.outDir) target.outDir = refOutDir;
    if (refRootDir && !target.rootDir) target.rootDir = refRootDir;
    if (!refOutDir || !refRootDir) walkReferences(target, refConfig.references, refDir, visited, pairs);
  }
};

interface TSConfigInfo {
  isFile: boolean;
  compilerOptions: CompilerOptions;
  fileNames: string[];
  include: string[] | undefined;
  exclude: string[] | undefined;
  sourceMapPairs: SourceMap[];
}

const EMPTY: Omit<TSConfigInfo, 'isFile'> = {
  compilerOptions: {},
  fileNames: [],
  include: undefined,
  exclude: undefined,
  sourceMapPairs: [],
};

export const loadTSConfig = async (tsConfigFilePath: string): Promise<TSConfigInfo> => {
  if (!isFile(tsConfigFilePath)) return { isFile: false, ...EMPTY };

  try {
    const config = parseTsconfig(tsConfigFilePath);

    const dir = dirname(tsConfigFilePath);
    const compilerOptions = (config.compilerOptions ?? {}) as CompilerOptions;

    if (compilerOptions.outDir) compilerOptions.outDir = absDir(compilerOptions.outDir, dir);
    if (compilerOptions.rootDir) compilerOptions.rootDir = absDir(compilerOptions.rootDir, dir);
    if (compilerOptions.paths) {
      compilerOptions.pathsBasePath ??= dir;
    }

    const sourceMapPairs: SourceMap[] = [];
    if (config.references?.length) {
      walkReferences(compilerOptions, config.references, dir, new Set([tsConfigFilePath]), sourceMapPairs);
    }

    const include = resolvePatterns(config.include, dir, true);
    const exclude = resolvePatterns(config.exclude, dir, true);
    const files = resolvePatterns(config.files, dir);
    const fileNames = expandFileNames(dir, compilerOptions, include, exclude, files);

    return { isFile: true, compilerOptions, fileNames, include, exclude, sourceMapPairs };
  } catch {
    return { isFile: true, ...EMPTY };
  }
};
