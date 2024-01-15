import * as fs from 'fs';
import { promisify } from 'node:util';
import { walk as _walk } from '@nodelib/fs.walk';
import { type Options as FastGlobOptions } from 'fast-glob';
import fastGlob from 'fast-glob';
import picomatch from 'picomatch';
import { GLOBAL_IGNORE_PATTERNS, ROOT_WORKSPACE_NAME } from '../constants.js';
import { debugLogObject } from './debug.js';
import { dirname, join, relative, toPosix } from './path.js';
import { timerify } from './Performance.js';
import type { Entry } from '@nodelib/fs.walk';

const walk = promisify(_walk);

const _picomatch = timerify(picomatch);

type Options = { gitignore: boolean; cwd: string };

type GlobOptions = {
  readonly gitignore: boolean;
  readonly cwd: string;
  readonly dir: string;
} & FastGlobOptionsWithoutCwd;

type FastGlobOptionsWithoutCwd = Pick<FastGlobOptions, 'onlyDirectories' | 'ignore' | 'absolute' | 'dot'>;

type Gitignores = { ignores: string[]; unignores: string[] };

const cachedIgnores = new Map<string, Gitignores>();

function convertGitignoreToMicromatch(pattern: string) {
  let negated = pattern[0] === '!';
  if (negated) {
    pattern = pattern.slice(1);
  }

  let extPattern;

  if (pattern.startsWith('*/**/')) pattern = pattern.slice(5);

  if (pattern.startsWith('/')) pattern = pattern.slice(1);
  else pattern = '**/' + pattern;

  if (pattern.endsWith('/*')) extPattern = pattern;
  else if (pattern.endsWith('/')) extPattern = pattern + '**';
  else extPattern = pattern + '/**';

  return { negated, patterns: [pattern, extPattern] };
}

function parseGitignoreFile(filePath: string) {
  const file = fs.readFileSync(filePath, 'utf8');
  return file
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#'))
    .map(pattern => convertGitignoreToMicromatch(pattern));
}

async function parseFindGitignores(options: Options): Promise<Gitignores> {
  const ignores: string[] = ['.git', ...GLOBAL_IGNORE_PATTERNS];
  const unignores: string[] = [];
  const gitignoreFiles: string[] = [];
  const pmOptions = { ignore: unignores };

  // Warning: earlier matchers don't include later unignores (perf win, but can't unignore from ancestor gitignores)
  const matchers = ignores.map(ignore => _picomatch(ignore, pmOptions));

  const matcher = (str: string) => {
    for (const isMatch of matchers) {
      const state = isMatch(str);
      if (state) return state;
    }
    return false;
  };

  const entryFilter = (entry: Entry) => {
    if (entry.dirent.isFile() && entry.name === '.gitignore') {
      gitignoreFiles.push(entry.path);

      const dir = dirname(toPosix(entry.path));
      const base = relative(options.cwd, dir);
      const dirIgnores = base === '' ? ['.git', ...GLOBAL_IGNORE_PATTERNS] : [];
      const dirUnignores = [];

      for (const rule of parseGitignoreFile(entry.path)) {
        const [p, ext] = rule.patterns;
        if (rule.negated) {
          if (base === '') {
            if (!unignores.includes(ext)) dirUnignores.push(...rule.patterns);
          } else {
            if (!unignores.includes(ext.startsWith('**/') ? ext : '**/' + ext)) {
              dirUnignores.push(join(base, p), join(base, ext));
            }
          }
        } else {
          if (base === '') {
            if (!ignores.includes(ext)) dirIgnores.push(...rule.patterns);
          } else {
            if (!ignores.includes(ext.startsWith('**/') ? ext : '**/' + ext)) {
              dirIgnores.push(join(base, p), join(base, ext));
            }
          }
        }
      }

      ignores.push(...dirIgnores);
      unignores.push(...dirUnignores);
      cachedIgnores.set(dir, { ignores: dirIgnores, unignores: dirUnignores });
      matchers.push(...dirIgnores.map(ignore => _picomatch(ignore, pmOptions)));

      return true;
    }
    return false;
  };
  const deepFilter = (entry: Entry) => !matcher(relative(options.cwd, entry.path));
  await walk(options.cwd, {
    entryFilter: timerify(entryFilter),
    deepFilter: timerify(deepFilter),
  });
  debugLogObject('*', 'Parsed gitignore files', { gitignoreFiles, ignores, unignores });
  return { ignores, unignores };
}

const _parseFindGitignores = timerify(parseFindGitignores);

/** simpler and faster replacement for the globby npm library */
export async function globby(patterns: string | string[], options: GlobOptions): Promise<string[]> {
  const ignore = options.gitignore && Array.isArray(options.ignore) ? [...options.ignore] : [];
  if (options.gitignore) {
    let dir = options.dir;
    while (dir !== options.cwd) {
      const i = cachedIgnores.get(dir);
      if (i) {
        ignore.push(...i.ignores);
        ignore.push(...i.unignores.map(e => '!' + e));
      }
      dir = dirname(dir);
    }
    const i = cachedIgnores.get(options.cwd);
    if (i) ignore.push(...i.ignores);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { dir, ...fastGlobOptions } = { ...options, ignore };

  debugLogObject(relative(options.cwd, options.dir) || ROOT_WORKSPACE_NAME, `Glob options`, {
    patterns,
    ...fastGlobOptions,
  });

  return fastGlob(patterns, fastGlobOptions);
}

/** create a function that should be equivalent to `git check-ignored` */
export async function isGitIgnoredFn(options: Options): Promise<(path: string) => boolean> {
  cachedIgnores.clear();
  if (options.gitignore === false) return () => false;
  const gitignore = await _parseFindGitignores(options);
  const matcher = _picomatch(gitignore.ignores, { ignore: gitignore.unignores });
  const isGitIgnored = (filePath: string) => {
    const ret = matcher(relative(options.cwd, filePath));
    // debugLogObject(filePath, 'isGitIgnored', { path: relative(options.cwd, filePath), gitignore });
    return ret;
  };
  return timerify(isGitIgnored);
}
