import { globSync } from 'tinyglobby';
import { compact } from './array.ts';
import {
  computeGlobCacheKey,
  createDirTracker,
  getCachedGlob,
  isGlobCacheEnabled,
  setCachedGlob,
} from './glob-cache.ts';
import { getGitignoreFingerprint, glob, reconcileGitignoredPaths } from './glob-core.ts';
import { timerify } from './Performance.ts';
import { isAbsolute, join, relative } from './path.ts';

interface GlobOptions {
  cwd: string;
  dir?: string;
  patterns: string[];
  gitignore?: boolean;
  name?: boolean;
  label?: string;
}

// Absolute patterns repeat the cwd, which may contain glob characters (e.g. `/Dropbox (Team)/app`)
const prepend = (pattern: string, cwd: string, relativePath: string) => {
  const isNegated = pattern.startsWith('!');
  const id = isNegated ? pattern.slice(1) : pattern;
  if (!isAbsolute(id) && !relativePath) return pattern;
  const globPattern = isAbsolute(id) ? relative(cwd, id) : join(relativePath, id);
  return isNegated ? `!${globPattern}` : globPattern;
};

// Globbing from root as cwd to include all gitignore files and ignore patterns, so we need to prepend dirs to patterns
const prependDirToPatterns = (cwd: string, dir: string, patterns: string[]) => {
  const relativePath = dir === cwd ? '' : relative(cwd, dir);
  return compact(patterns.map(p => removeProductionSuffix(prepend(p, cwd, relativePath)))).sort(negatedLast);
};

export const removeProductionSuffix = (pattern: string) => pattern.replace(/!$/, '');

const negatedLast = (pattern: string) => (pattern.startsWith('!') ? 1 : -1);

export const prependDirToPattern = (dir: string, pattern: string) => {
  if (pattern.startsWith('!')) return `!${join(dir, pattern.slice(1))}`;
  return join(dir, pattern);
};

export const negate = (pattern: string) => pattern.replace(/^!?/, '!');
export const hasProductionSuffix = (pattern: string) => pattern.endsWith('!');
export const hasNoProductionSuffix = (pattern: string) => !pattern.endsWith('!');

const defaultGlob = async ({ cwd, dir = cwd, patterns, gitignore = true, label }: GlobOptions) => {
  if (patterns.length === 0) return [];

  const globPatterns = prependDirToPatterns(cwd, dir, patterns);

  // Only negated patterns? Bail out.
  if (globPatterns[0].startsWith('!')) return [];

  const cacheEnabled = isGlobCacheEnabled();
  const gitignoreFingerprint = gitignore ? getGitignoreFingerprint() : '';
  const cacheKey = cacheEnabled
    ? computeGlobCacheKey({ patterns: globPatterns, cwd, dir, gitignore, gitignoreFingerprint })
    : '';
  if (cacheEnabled) {
    const cached = getCachedGlob(cacheKey);
    if (cached) return gitignore ? reconcileGitignoredPaths(cached, cwd) : cached;
  }

  const tracker = cacheEnabled ? createDirTracker() : undefined;

  const paths = await glob(globPatterns, {
    cwd,
    dir,
    gitignore,
    absolute: true,
    dot: true,
    label,
    fs: tracker?.fs,
  });

  if (cacheEnabled && paths.length > 0) setCachedGlob(cacheKey, paths, dir, tracker?.dirs);

  return gitignore ? reconcileGitignoredPaths(paths, cwd) : paths;
};

const syncGlob = ({ cwd, patterns }: { cwd: string; patterns: string | string[] }) => {
  const cacheEnabled = isGlobCacheEnabled();
  const patternList = [patterns].flat().map(pattern => prepend(pattern, cwd, ''));
  const cacheKey = cacheEnabled
    ? computeGlobCacheKey({ patterns: patternList, cwd, dir: cwd, gitignore: false, gitignoreFingerprint: '' })
    : '';
  if (cacheEnabled) {
    const cached = getCachedGlob(cacheKey);
    if (cached) return cached;
  }
  const tracker = cacheEnabled ? createDirTracker() : undefined;
  const paths = globSync(patternList, {
    cwd,
    absolute: true,
    followSymbolicLinks: false,
    expandDirectories: false,
    fs: tracker?.fs,
  });
  if (cacheEnabled && paths.length > 0) setCachedGlob(cacheKey, paths, cwd, tracker?.dirs);
  return paths;
};

const dirGlob = async ({ cwd, patterns, gitignore = true }: GlobOptions) =>
  glob(
    patterns.map(pattern => prepend(pattern, cwd, '')),
    { cwd, dir: cwd, onlyDirectories: true, gitignore }
  );

export const _glob = timerify(defaultGlob);

export const _syncGlob = timerify(syncGlob);

export const _dirGlob = timerify(dirGlob);
