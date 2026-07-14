import type { SourceMap } from '../types/config.ts';
import type { CompilerOptions } from '../types/project.ts';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.ts';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { debugLog, debugLogArray } from './debug.ts';
import { findFileWithExtensions, isDirectory } from './fs.ts';
import { _glob, prependDirToPattern } from './glob.ts';
import { getPackageNameFromModuleSpecifier } from './modules.ts';
import { getPackageMapTarget } from './package-json.ts';
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
  const seen = new Set<string>();
  const unique: SourceMap[] = [];
  for (const sm of all) {
    const key = `${sm.srcDir}\0${sm.outDir}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(sm);
  }
  workspace.sourceMaps = unique.sort((a, b) => b.outDir.length - a.outDir.length);
};

const isUnderOutDir = (absPath: string, outDir: string) => absPath === outDir || absPath.startsWith(`${outDir}/`);

const rewriteOne = (pair: SourceMap, absSpecifier: string, extensions: string) => {
  if (pair.srcDir === pair.outDir || !isUnderOutDir(absSpecifier, pair.outDir)) return;
  return pair.srcDir + absSpecifier.slice(pair.outDir.length).replace(matchExt, extensions);
};

const rewritePattern = (sourceMaps: SourceMap[], absSpecifier: string, extensions: string) => {
  for (const sm of sourceMaps) {
    const r = rewriteOne(sm, absSpecifier, extensions);
    if (r) return r;
  }
};

export type WorkspacePackageTargetHandler = (
  specifier: string,
  filePath: string
) => { dir: string; target: unknown; patternMatch?: string } | undefined;

export const getWorkspacePackageTargetHandler = (chief: ConfigurationChief): WorkspacePackageTargetHandler => {
  return (specifier, filePath) => {
    const isImports = specifier.startsWith('#');
    let workspace: Workspace | undefined;
    let key = specifier;
    if (isImports) {
      workspace = chief.findWorkspaceByFilePath(filePath);
    } else {
      const packageName = getPackageNameFromModuleSpecifier(specifier);
      if (!packageName) return;
      workspace = chief.workspacesByPkgName.get(packageName);
      key = packageName === specifier ? '.' : `.${specifier.slice(packageName.length)}`;
    }
    if (!workspace) return;
    const manifest = chief.workspacePackages.get(workspace.name)?.manifest;
    const map = isImports ? manifest?.imports : manifest?.exports;
    if (!manifest || !map) return;
    const result = getPackageMapTarget(map, key);
    if (result) return { dir: workspace.dir, ...result };
  };
};

export const getModuleSourcePathHandler = (chief: ConfigurationChief) => {
  const toSourceMapCache = new Map<string, string | undefined>();

  return (filePath: string) => {
    if (!isInternal(filePath) || hasTSExt.test(filePath)) return;
    if (toSourceMapCache.has(filePath)) return toSourceMapCache.get(filePath);
    const workspace = chief.findWorkspaceByFilePath(filePath);
    let result: string | undefined;
    if (workspace?.sourceMaps) {
      for (const { srcDir, outDir } of workspace.sourceMaps) {
        if (!(isUnderOutDir(filePath, outDir) || srcDir === outDir)) continue;
        const basePath = (srcDir + filePath.slice(outDir.length)).replace(matchExt, '');
        const srcFilePath = findFileWithExtensions(basePath, sourceExtensions);
        if (srcFilePath && srcFilePath !== filePath) {
          debugLog('*', `Source mapping ${toRelative(filePath, chief.cwd)} → ${toRelative(srcFilePath, chief.cwd)}`);
          result = srcFilePath;
          break;
        }
      }
    }
    toSourceMapCache.set(filePath, result);
    return result;
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

    const filePaths = await _glob({ patterns: Array.from(patterns), cwd: chief.cwd, dir, label });

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
  if (ws?.sourceMaps) {
    for (const sm of ws.sourceMaps) {
      const r = rewriteOne(sm, absSpecifier, extensions);
      if (r) out.push(r);
    }
  }
  return out;
};

export type ToSourceFilePath = ReturnType<typeof getModuleSourcePathHandler>;
