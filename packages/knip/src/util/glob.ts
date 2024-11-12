import fg from 'fast-glob';
import { GLOBAL_IGNORE_PATTERNS } from '../constants.js';
import { timerify } from './Performance.js';
import { compact } from './array.js';
import { glob } from './glob-core.js';
import { isAbsolute, join, relative } from './path.js';

interface GlobOptions {
  cwd: string;
  dir?: string;
  patterns: string[];
  gitignore?: boolean;
  name?: boolean;
  label?: string;
}

const prepend = (pattern: string, relativePath: string) =>
  isAbsolute(pattern.replace(/^!/, '')) ? pattern : prependDirToPattern(relativePath, pattern);

// Globbing from root as cwd to include all gitignore files and ignore patterns, so we need to prepend dirs to patterns
const prependDirToPatterns = (cwd: string, dir: string, patterns: string[]) => {
  const relativePath = relative(cwd, dir);
  return compact([patterns].flat().map(p => removeProductionSuffix(prepend(p, relativePath)))).sort(negatedLast);
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

const defaultGlob = async ({ cwd, dir = cwd, patterns, gitignore = true, label }: GlobOptions) => {
  if (patterns.length === 0) return [];

  const globPatterns = prependDirToPatterns(cwd, dir, patterns);

  // Only negated patterns? Bail out.
  if (globPatterns[0].startsWith('!')) return [];

  return glob(globPatterns, {
    cwd,
    dir,
    gitignore,
    absolute: true,
    dot: true,
    label,
  });
};

const firstGlob = async ({ cwd, patterns }: GlobOptions) => {
  const stream = fg.globStream(patterns.map(removeProductionSuffix), { cwd, ignore: GLOBAL_IGNORE_PATTERNS });
  for await (const entry of stream) {
    return entry;
  }
};

const dirGlob = async ({ cwd, patterns, gitignore = true }: GlobOptions) =>
  glob(patterns, {
    cwd,
    dir: cwd,
    onlyDirectories: true,
    gitignore,
  });

export const _glob = timerify(defaultGlob);

export const _firstGlob = timerify(firstGlob);

export const _dirGlob = timerify(dirGlob);
