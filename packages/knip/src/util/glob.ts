import fg from 'fast-glob';
import { GLOBAL_IGNORE_PATTERNS } from '../constants.js';
import { compact } from './array.js';
import { globby } from './globby.js';
import { join, relative } from './path.js';
import { timerify } from './Performance.js';

export const prependDirToPattern = (workingDir: string, pattern: string) => {
  if (pattern.startsWith('!')) return '!' + join(workingDir, pattern.slice(1));
  return join(workingDir, pattern);
};

export const negate = (pattern: string) => pattern.replace(/^!?/, '!');
export const hasProductionSuffix = (pattern: string) => pattern.endsWith('!');
export const hasNoProductionSuffix = (pattern: string) => !pattern.endsWith('!');

const removeProductionSuffix = (pattern: string) => pattern.replace(/!$/, '');

const negatedLast = (pattern: string) => (pattern.startsWith('!') ? 1 : -1);

interface BaseGlobOptions {
  cwd: string;
  patterns: string[];
  gitignore?: boolean;
}

interface GlobOptions extends BaseGlobOptions {
  workingDir?: string;
}

const glob = async ({ cwd, workingDir = cwd, patterns, gitignore = true }: GlobOptions) => {
  if (patterns.length === 0) return [];

  const relativePath = relative(cwd, workingDir);

  // Globbing from root as cwd to include all gitignore files and ignore patterns, so we need to prepend dirs to patterns
  const prepend = (pattern: string) => prependDirToPattern(relativePath, pattern);
  const globPatterns = compact([patterns].flat().map(prepend).map(removeProductionSuffix)).sort(negatedLast);

  // Only negated patterns? Bail out.
  if (globPatterns[0].startsWith('!')) return [];

  return globby(globPatterns, {
    cwd,
    dir: workingDir,
    gitignore,
    absolute: true,
    dot: true,
  });
};

const pureGlob = async ({ cwd, patterns, gitignore = true }: BaseGlobOptions) => {
  if (patterns.length === 0) return [];
  return globby(patterns, {
    cwd,
    dir: cwd,
    gitignore,
    absolute: true,
  });
};

const firstGlob = async ({ cwd, patterns }: BaseGlobOptions) => {
  const stream = fg.stream(patterns.map(removeProductionSuffix), { cwd, ignore: GLOBAL_IGNORE_PATTERNS });
  for await (const entry of stream) {
    return entry;
  }
};

const dirGlob = async ({ cwd, patterns, gitignore = true }: BaseGlobOptions) =>
  globby(patterns, {
    cwd,
    dir: cwd,
    onlyDirectories: true,
    gitignore,
  });

export const _glob = timerify(glob);

export const _pureGlob = timerify(pureGlob);

export const _firstGlob = timerify(firstGlob);

export const _dirGlob = timerify(dirGlob);
