import fg from 'fast-glob';
import { globby } from 'globby';
import memoize from 'nano-memoize';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import { compact } from './array.js';
import { debugLogObject } from './debug.js';
import { join, relative } from './path.js';
import { timerify } from './performance.js';

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
  ignore?: string[];
}

interface GlobOptions extends BaseGlobOptions {
  workingDir?: string;
  gitignore?: boolean;
}

const glob = async ({ cwd, workingDir = cwd, patterns, ignore = [], gitignore = true }: GlobOptions) => {
  const relativePath = relative(cwd, workingDir);

  // Globbing from root as cwd to include all gitignore files and ignore patterns, so we need to prepend dirs to patterns
  const prepend = (pattern: string) => prependDirToPattern(relativePath, pattern);
  const globPatterns = compact([patterns].flat().map(prepend).map(removeProductionSuffix)).sort(negatedLast);

  const ignorePatterns = compact([...ignore, '**/node_modules/**']);

  debugLogObject(`Globbing (${relativePath || ROOT_WORKSPACE_NAME})`, { cwd, globPatterns, ignorePatterns });

  return globby(globPatterns, {
    cwd,
    ignore: ignorePatterns,
    gitignore,
    absolute: true,
    dot: true,
  });
};

const pureGlob = async ({ cwd, patterns, ignore = [] }: BaseGlobOptions) =>
  globby(patterns, {
    cwd,
    ignore: [...ignore, '**/node_modules/**'],
    absolute: true,
  });

const firstGlob = async ({ cwd, patterns }: BaseGlobOptions) => {
  const stream = fg.stream(patterns.map(removeProductionSuffix), { cwd, ignore: ['**/node_modules/**'] });
  for await (const entry of stream) {
    return entry;
  }
};

const dirGlob = async ({ cwd, patterns }: BaseGlobOptions) =>
  globby(patterns, {
    cwd,
    onlyDirectories: true,
  });

const memoOptions = { serializer: JSON.stringify, callTimeout: 0 };

const memoizedGlob = memoize(glob, memoOptions);
Object.defineProperty(memoizedGlob, 'name', { value: 'glob' });

const memoizedFirstGlob = memoize(firstGlob, memoOptions);
Object.defineProperty(memoizedFirstGlob, 'name', { value: 'firstGlob' });

export const _glob = timerify(memoizedGlob);

export const _pureGlob = timerify(pureGlob);

export const _firstGlob = timerify(memoizedFirstGlob);

export const _dirGlob = timerify(dirGlob);
