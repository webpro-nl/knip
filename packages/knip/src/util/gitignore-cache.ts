import fs from 'node:fs';
// oxlint-disable-next-line no-restricted-imports
import path from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { version } from '../version.ts';
import { debugLog } from './debug.ts';
import { isDirectory, isFile } from './fs.ts';
import type { Gitignores } from './glob-core.ts';
import { dirname } from './path.ts';

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

const CACHE_FILENAME = `gitignore-${version}.cache`;

let cacheFilePath: string | undefined;
let cache: Map<string, GitignoreCacheEntry> | undefined;
let isDirty = false;

export const initGitignoreCache = (cacheLocation: string) => {
  cacheFilePath = path.resolve(cacheLocation, CACHE_FILENAME);
  if (isFile(cacheFilePath)) {
    try {
      cache = deserialize(fs.readFileSync(cacheFilePath));
    } catch {
      debugLog('*', `Error reading gitignore cache from ${cacheFilePath}`);
      cache = new Map();
    }
  } else {
    cache = new Map();
  }
};

export const isGitignoreCacheEnabled = () => cache !== undefined;

const workspaceDirsKey = (workspaceDirs?: Set<string>): string => {
  if (!workspaceDirs || workspaceDirs.size === 0) return '';
  return [...workspaceDirs].sort().join('\0');
};

const validateEntry = (entry: GitignoreCacheEntry, wsKey: string, cwd: string): boolean => {
  if (entry.workspaceDirsKey !== wsKey) return false;
  const files = entry.gitignoreFiles;
  const mtimes = entry.mtimes;
  for (let i = 0; i < files.length; i++) {
    const abs = path.isAbsolute(files[i]) ? files[i] : path.resolve(cwd, files[i]);
    try {
      if (fs.statSync(abs).mtimeMs !== mtimes[i]) return false;
    } catch {
      return false;
    }
  }
  return true;
};

export const getCachedGitignore = (cwd: string, workspaceDirs?: Set<string>): CachedGitignoreResult | undefined => {
  if (!cache) return undefined;
  const entry = cache.get(cwd);
  if (!entry) return undefined;
  const wsKey = workspaceDirsKey(workspaceDirs);
  if (!validateEntry(entry, wsKey, cwd)) {
    cache.delete(cwd);
    isDirty = true;
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
  if (!cache) return;
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
  cache.set(cwd, {
    gitignoreFiles: validFiles,
    mtimes,
    ignores: [...ignores],
    unignores: [...unignores],
    perDirIgnores: perDir,
    workspaceDirsKey: workspaceDirsKey(workspaceDirs),
  });
  isDirty = true;
};

export const flushGitignoreCache = (): void => {
  if (!cache || !cacheFilePath || !isDirty) return;
  try {
    const dir = dirname(cacheFilePath);
    if (!isDirectory(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(cacheFilePath, serialize(cache));
    isDirty = false;
  } catch {
    debugLog('*', `Error writing gitignore cache to ${cacheFilePath}`);
  }
};
