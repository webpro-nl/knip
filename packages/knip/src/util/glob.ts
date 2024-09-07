import fg from 'fast-glob';
import { GLOBAL_IGNORE_PATTERNS } from '../constants.js';
import { timerify } from './Performance.js';
import { compact } from './array.js';
import { globby } from './glob-core.js';
import { join, relative } from './path.js';

interface GlobOptions {
  cwd: string;
  dir?: string;
  patterns: string[];
  gitignore?: boolean;
}

// Globbing from root as cwd to include all gitignore files and ignore patterns, so we need to prepend dirs to patterns
const prependDirToPatterns = (cwd: string, dir: string, patterns: string[]) => {
  const relativePath = relative(cwd, dir);
  const prepend = (pattern: string) => prependDirToPattern(relativePath, pattern);
  return compact([patterns].flat().map(prepend).map(removeProductionSuffix)).sort(negatedLast);
};

const removeProductionSuffix = (pattern: string) => pattern.replace(/!$/, '');

const negatedLast = (pattern: string) => (pattern.startsWith('!') ? 1 : -1);

export const prependDirToPattern = (dir: string, pattern: string) => {
  if (pattern.startsWith('!')) return `!${join(dir, pattern.slice(1))}`;
  return join(dir, pattern);
};

export const negate = (pattern: string) => pattern.replace(/^!?/, '!');
export const hasProductionSuffix = (pattern: string) => pattern.endsWith('!');
export const hasNoProductionSuffix = (pattern: string) => !pattern.endsWith('!');

const glob = async ({ cwd, dir = cwd, patterns, gitignore = true }: GlobOptions) => {
  if (patterns.length === 0) return [];

  const globPatterns = prependDirToPatterns(cwd, dir, patterns);

  // Only negated patterns? Bail out.
  if (globPatterns[0].startsWith('!')) return [];

  return globby(globPatterns, {
    cwd,
    dir,
    gitignore,
    absolute: true,
    dot: true,
  });
};

const firstGlob = async ({ cwd, patterns }: GlobOptions) => {
  const stream = fg.globStream(patterns.map(removeProductionSuffix), { cwd, ignore: GLOBAL_IGNORE_PATTERNS });
  for await (const entry of stream) {
    return entry;
  }
};

const dirGlob = async ({ cwd, patterns, gitignore = true }: GlobOptions) =>
  globby(patterns, {
    cwd,
    dir: cwd,
    onlyDirectories: true,
    gitignore,
  });

export const _glob = timerify(glob);

export const _firstGlob = timerify(firstGlob);

export const _dirGlob = timerify(dirGlob);
