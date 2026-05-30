import fs from 'node:fs';
// oxlint-disable-next-line no-restricted-imports
import path from 'node:path';
import { createDiskCache, mtimeMatches } from './disk-cache.ts';
import type { Gitignores } from './glob-core.ts';

interface SerializedGitignores {
  ignores: string[];
  unignores: string[];
}

interface GitignoreCacheEntry {
  /** Relative paths (to cwd) — matches the contract of findAndParseGitignores's return */
  gitignoreFiles: string[];
  /** Parallel array: mtimeMs of each gitignoreFiles[i] at cache write */
  mtimes: number[];
  ignores: string[];
  unignores: string[];
  /** Absolute dir path → cached ignores/unignores for that dir */
  perDirIgnores: Record<string, SerializedGitignores>;
  /** Sorted workspace dirs, joined with \0 — invalidates when workspace set changes */
  workspaceDirsKey: string;
}

export interface CachedGitignoreResult {
  ignores: Set<string>;
  unignores: Set<string>;
  gitignoreFiles: string[];
  perDirIgnores: Map<string, Gitignores>;
}

const store = createDiskCache<GitignoreCacheEntry>('gitignore');

export const initGitignoreCache = store.init;
export const isGitignoreCacheEnabled = store.isEnabled;
export const flushGitignoreCache = store.flush;

const workspaceDirsKey = (workspaceDirs?: Set<string>): string => {
  if (!workspaceDirs || workspaceDirs.size === 0) return '';
  return [...workspaceDirs].sort().join('\0');
};

const validateEntry = (entry: GitignoreCacheEntry, wsKey: string, cwd: string): boolean => {
  if (entry.workspaceDirsKey !== wsKey) return false;
  const { gitignoreFiles, mtimes } = entry;
  for (let i = 0; i < gitignoreFiles.length; i++) {
    const abs = path.isAbsolute(gitignoreFiles[i]) ? gitignoreFiles[i] : path.resolve(cwd, gitignoreFiles[i]);
    if (!mtimeMatches(abs, mtimes[i])) return false;
  }
  return true;
};

export const getCachedGitignore = (cwd: string, workspaceDirs?: Set<string>): CachedGitignoreResult | undefined => {
  const entry = store.get(cwd);
  if (!entry) return undefined;
  const wsKey = workspaceDirsKey(workspaceDirs);
  if (!validateEntry(entry, wsKey, cwd)) {
    store.delete(cwd);
    return undefined;
  }
  const perDirIgnores = new Map<string, Gitignores>();
  for (const dir in entry.perDirIgnores) {
    const data = entry.perDirIgnores[dir];
    perDirIgnores.set(dir, { ignores: new Set(data.ignores), unignores: new Set(data.unignores) });
  }
  return {
    ignores: new Set(entry.ignores),
    unignores: new Set(entry.unignores),
    gitignoreFiles: entry.gitignoreFiles,
    perDirIgnores,
  };
};

export const setCachedGitignore = (
  cwd: string,
  workspaceDirs: Set<string> | undefined,
  gitignoreFiles: string[],
  ignores: Set<string>,
  unignores: Set<string>,
  perDirIgnores: Map<string, Gitignores>
): void => {
  if (!store.isEnabled()) return;
  const mtimes: number[] = [];
  const validFiles: string[] = [];
  for (const file of gitignoreFiles) {
    const abs = path.isAbsolute(file) ? file : path.resolve(cwd, file);
    try {
      mtimes.push(fs.statSync(abs).mtimeMs);
      validFiles.push(file);
    } catch {
      // File was removed between read and stat; skip rather than poison cache
    }
  }
  const perDir: Record<string, SerializedGitignores> = {};
  for (const [dir, data] of perDirIgnores) {
    perDir[dir] = { ignores: [...data.ignores], unignores: [...data.unignores] };
  }
  store.set(cwd, {
    gitignoreFiles: validFiles,
    mtimes,
    ignores: [...ignores],
    unignores: [...unignores],
    perDirIgnores: perDir,
    workspaceDirsKey: workspaceDirsKey(workspaceDirs),
  });
};
