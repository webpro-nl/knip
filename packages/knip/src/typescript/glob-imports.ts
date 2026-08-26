import { existsSync } from 'node:fs';
import type { ImportGlob } from '../types/module-graph.ts';
import { _syncGlob } from '../util/glob.ts';
import { dirname, isAbsolute, join, toRelative } from '../util/path.ts';
import type { ResolveGlobPattern } from './resolve-module-names.ts';

function resolveBaseDir(base: string, dir: string, resolveGlobPattern: ResolveGlobPattern) {
  if (base.startsWith('.')) return join(dir, base);
  if (isAbsolute(base)) return base;
  for (const resolved of resolveGlobPattern(base, dir)) {
    if (resolved !== base && existsSync(resolved)) return resolved;
  }
  return undefined;
}

export function resolveImportGlobs(
  items: ImportGlob[],
  containingFile: string,
  resolveGlobPattern: ResolveGlobPattern,
  workspaceRoot: string
): string[] {
  const filePaths: string[] = [];
  const dir = dirname(containingFile);

  for (const { patterns, base, filter } of items) {
    if (base !== undefined) {
      const cwd = resolveBaseDir(base, dir, resolveGlobPattern);
      if (!cwd) continue;
      for (const filePath of _syncGlob({ patterns, cwd })) {
        if (!filter || filter.test(`./${toRelative(filePath, cwd)}`)) filePaths.push(filePath);
      }
    } else {
      const resolved: string[] = [];
      for (const pattern of patterns) {
        const isNegated = pattern[0] === '!';
        const specifier = isNegated ? pattern.slice(1) : pattern;
        if (specifier[0] === '/') {
          const rooted = join(workspaceRoot, specifier);
          resolved.push(isNegated ? `!${rooted}` : rooted);
        } else {
          for (const p of resolveGlobPattern(pattern, dir)) resolved.push(p);
        }
      }
      if (resolved.length === 0) continue;
      for (const filePath of _syncGlob({ patterns: resolved, cwd: dir })) filePaths.push(filePath);
    }
  }

  return filePaths;
}
