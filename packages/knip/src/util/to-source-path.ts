import type { SourceMap } from '../types/config.ts';
import type { CompilerOptions } from '../types/project.ts';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.ts';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { debugLog, debugLogArray } from './debug.ts';
import { findFileWithExtensions, isDirectory } from './fs.ts';
import { _glob, prependDirToPattern } from './glob.ts';
import { isAbsolute, isInternal, join, toRelative } from './path.ts';

const defaultExtensions = `.{${[...DEFAULT_EXTENSIONS].map(ext => ext.slice(1)).join(',')}}`;
const hasTSExt = /(?<!\.d)\.(m|c)?tsx?$/;
const matchExt = /(\.d)?\.(m|c)?(j|t)s$/;

const sourceExtensions = [...DEFAULT_EXTENSIONS];

const tsconfigSourceMap = (dir: string, compilerOptions: CompilerOptions): SourceMap => {
  const srcDir = join(dir, 'src');
  const outDirHasSrc = compilerOptions.outDir && isDirectory(compilerOptions.outDir, 'src');
  const resolvedSrc = compilerOptions.rootDir ?? (outDirHasSrc ? dir : isDirectory(srcDir) ? srcDir : dir);
  return { srcDir: resolvedSrc, outDir: compilerOptions.outDir || resolvedSrc };
};

export const augmentWorkspace = (
  workspace: Workspace,
  dir: string,
  compilerOptions: CompilerOptions | undefined,
  pluginSourceMaps: SourceMap[] = []
) => {
  const all = compilerOptions ? [...pluginSourceMaps, tsconfigSourceMap(dir, compilerOptions)] : pluginSourceMaps;
  if (all.length === 0) return;
  workspace.sourceMaps = all.sort((a, b) => b.outDir.length - a.outDir.length);
};

const isUnderOutDir = (absPath: string, outDir: string) => absPath === outDir || absPath.startsWith(`${outDir}/`);

const isUnderSrcDir = (absPath: string, srcDir: string) => absPath === srcDir || absPath.startsWith(`${srcDir}/`);

const rewritePattern = (sourceMaps: SourceMap[], absSpecifier: string, extensions: string) => {
  for (const { srcDir, outDir } of sourceMaps) {
    if (!isUnderSrcDir(absSpecifier, srcDir) && isUnderOutDir(absSpecifier, outDir)) {
      return srcDir + absSpecifier.slice(outDir.length).replace(matchExt, extensions);
    }
  }
};

export const getModuleSourcePathHandler = (chief: ConfigurationChief) => {
  const toSourceMapCache = new Map<string, string>();

  return (filePath: string) => {
    if (!isInternal(filePath) || hasTSExt.test(filePath)) return;
    if (toSourceMapCache.has(filePath)) return toSourceMapCache.get(filePath);
    const workspace = chief.findWorkspaceByFilePath(filePath);
    if (!workspace?.sourceMaps) return;
    for (const { srcDir, outDir } of workspace.sourceMaps) {
      if (!(isUnderOutDir(filePath, outDir) || srcDir === outDir)) continue;
      const basePath = (srcDir + filePath.slice(outDir.length)).replace(matchExt, '');
      const srcFilePath = findFileWithExtensions(basePath, sourceExtensions);
      if (srcFilePath) {
        toSourceMapCache.set(filePath, srcFilePath);
        if (srcFilePath !== filePath) {
          debugLog('*', `Source mapping ${toRelative(filePath, chief.cwd)} → ${toRelative(srcFilePath, chief.cwd)}`);
          return srcFilePath;
        }
      }
    }
  };
};

export const getToSourcePathsHandler = (chief: ConfigurationChief) => {
  return async (specifiers: Set<string>, dir: string, extensions = defaultExtensions, label: string) => {
    const patterns = new Set<string>();

    for (const specifier of specifiers) {
      const absSpecifier = isAbsolute(specifier) ? specifier : prependDirToPattern(dir, specifier);
      const ws = chief.findWorkspaceByFilePath(absSpecifier);
      const mapped = ws?.sourceMaps && rewritePattern(ws.sourceMaps, absSpecifier, extensions);
      patterns.add(mapped ?? absSpecifier);
    }

    const filePaths = await _glob({ patterns: Array.from(patterns), cwd: dir, label });

    debugLogArray(toRelative(dir, chief.cwd), 'Source mapping (package.json)', filePaths);

    return filePaths;
  };
};

export const toSourceMappedSpecifiers = (
  ws: Workspace | undefined,
  absSpecifier: string,
  extensions = defaultExtensions
) => {
  const out: string[] = [];
  if (!ws?.sourceMaps) return out;
  for (const { srcDir, outDir } of ws.sourceMaps) {
    if (!isUnderSrcDir(absSpecifier, srcDir) && isUnderOutDir(absSpecifier, outDir)) {
      out.push(srcDir + absSpecifier.slice(outDir.length).replace(matchExt, extensions));
    }
  }
  return out;
};

export type ToSourceFilePath = ReturnType<typeof getModuleSourcePathHandler>;
