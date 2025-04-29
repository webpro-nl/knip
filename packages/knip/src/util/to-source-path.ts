import type { CompilerOptions } from 'typescript';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { debugLog, debugLogArray } from './debug.js';
import { isDirectory } from './fs.js';
import { _glob, _syncGlob } from './glob.js';
import { isAbsolute, isInternal, join, toRelative } from './path.js';

const defaultExtensions = `.{${DEFAULT_EXTENSIONS.map(ext => ext.slice(1)).join(',')}}`;
const hasTSExt = /(?<!\.d)\.(m|c)?tsx?$/;
const hasDTSExt = /.d\.(m|c)?ts$/;
const matchExt = /(\.d)?\.(m|c)?(j|t)s$/;

export const augmentWorkspace = (workspace: Workspace, dir: string, compilerOptions: CompilerOptions) => {
  const srcDir = join(dir, 'src');
  workspace.srcDir = compilerOptions.rootDir ?? (isDirectory(srcDir) ? srcDir : dir);
  workspace.outDir = compilerOptions.outDir || workspace.srcDir;
};

export const getToSourcePathHandler = (chief: ConfigurationChief) => {
  const toSourceMapCache = new Map<string, string>();

  return (filePath: string) => {
    if (!isInternal(filePath) || hasTSExt.test(filePath)) return;
    if (toSourceMapCache.has(filePath)) return toSourceMapCache.get(filePath);
    const workspace = chief.findWorkspaceByFilePath(filePath);
    if (workspace?.srcDir && workspace.outDir) {
      if (
        (!filePath.startsWith(workspace.srcDir) && filePath.startsWith(workspace.outDir)) ||
        (workspace.srcDir === workspace.outDir && hasDTSExt.test(filePath))
      ) {
        const pattern = filePath.replace(workspace.outDir, workspace.srcDir).replace(matchExt, defaultExtensions);
        const srcFilePath = _syncGlob({ patterns: pattern })[0];
        toSourceMapCache.set(filePath, srcFilePath);
        if (srcFilePath && srcFilePath !== filePath) {
          debugLog('*', `Source mapping ${toRelative(filePath)} → ${toRelative(srcFilePath)}`);
          return srcFilePath;
        }
      }
    }
  };
};

export const getToSourcePathsHandler = (chief: ConfigurationChief) => {
  return async (specifiers: Set<string>, cwd: string, extensions = defaultExtensions) => {
    const patterns = new Set<string>();

    for (const specifier of specifiers) {
      const absSpecifier = isAbsolute(specifier) ? specifier : join(cwd, specifier);
      const ws = chief.findWorkspaceByFilePath(absSpecifier);
      if (ws?.srcDir && ws.outDir && !absSpecifier.startsWith(ws.srcDir) && absSpecifier.startsWith(ws.outDir)) {
        const pattern = absSpecifier.replace(ws.outDir, ws.srcDir).replace(matchExt, extensions);
        patterns.add(pattern);
      } else {
        patterns.add(absSpecifier);
      }
    }

    const filePaths = await _glob({ patterns: Array.from(patterns), cwd });

    debugLogArray(toRelative(cwd), 'Source mapping (package.json)', filePaths);

    return filePaths;
  };
};

export type ToSourceFilePath = ReturnType<typeof getToSourcePathHandler>;
