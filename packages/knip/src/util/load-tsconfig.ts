import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';
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

const resolveReference = (refPath: string, dir: string): string | undefined => {
  const abs = isAbsolute(refPath) ? refPath : join(dir, refPath);
  if (_isFile(abs)) return abs;
  const withTsconfig = join(abs, 'tsconfig.json');
  return _isFile(withTsconfig) ? withTsconfig : undefined;
};

const fillFromReferences = (
  target: CompilerOptions,
  references: TsConfigJsonResolved['references'],
  dir: string,
  visited: Set<string>
) => {
  if (!references?.length) return;
  for (const ref of references) {
    if (target.outDir && target.rootDir) return;
    const refPath = resolveReference(ref.path, dir);
    if (!refPath || visited.has(refPath)) continue;
    visited.add(refPath);
    const refConfig = parseTsconfig(refPath);
    const refDir = dirname(refPath);
    const refOpts = refConfig.compilerOptions;
    if (refOpts?.outDir && !target.outDir) target.outDir = toAbsolute(refOpts.outDir, refDir).replace(/\/+$/, '');
    if (refOpts?.rootDir && !target.rootDir) target.rootDir = toAbsolute(refOpts.rootDir, refDir).replace(/\/+$/, '');
    if (!refOpts?.outDir || !refOpts?.rootDir) fillFromReferences(target, refConfig.references, refDir, visited);
  }
};

export const loadTSConfig = async (tsConfigFilePath: string) => {
  if (_isFile(tsConfigFilePath)) {
    try {
      const config = parseTsconfig(tsConfigFilePath);

      const dir = dirname(tsConfigFilePath);
      const compilerOptions = (config.compilerOptions ?? {}) as CompilerOptions;

      if (compilerOptions.outDir) compilerOptions.outDir = toAbsolute(compilerOptions.outDir, dir).replace(/\/+$/, '');
      if (compilerOptions.rootDir)
        compilerOptions.rootDir = toAbsolute(compilerOptions.rootDir, dir).replace(/\/+$/, '');
      if (compilerOptions.paths) {
        compilerOptions.pathsBasePath ??= dir;
      }
      if (compilerOptions.rootDirs) {
        compilerOptions.rootDirs = compilerOptions.rootDirs.map((d: string) => (isAbsolute(d) ? d : join(dir, d)));
      }

      if ((!compilerOptions.outDir || !compilerOptions.rootDir) && config.references?.length) {
        fillFromReferences(compilerOptions, config.references, dir, new Set([tsConfigFilePath]));
      }

      const include = resolvePatterns(config.include, dir, true);
      const exclude = resolvePatterns(config.exclude, dir, true);
      const files = resolvePatterns(config.files, dir);
      const fileNames = expandFileNames(dir, compilerOptions, include, exclude, files);

      return { isFile: true, compilerOptions, fileNames };
    } catch {
      return {
        isFile: true,
        compilerOptions: {} as CompilerOptions,
        fileNames: [] as string[],
      };
    }
  }
  return {
    isFile: false,
    compilerOptions: {} as CompilerOptions,
    fileNames: [] as string[],
  };
};
