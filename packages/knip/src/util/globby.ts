import * as fs from 'fs';
import { promisify } from 'node:util';
import { walk as _walk } from '@nodelib/fs.walk';
import { type Options as FastGlobOptions } from 'fast-glob';
import fastGlob from 'fast-glob';
import picomatch from 'picomatch';
import { GLOBAL_IGNORE_PATTERNS } from '../constants.js';
import { debugLogObject } from './debug.js';
import * as path from './path.js';
import { timerify } from './Performance.js';
import type { Entry } from '@nodelib/fs.walk';

const walk = promisify(_walk);

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

  if (!pattern.includes('/')) pattern = '**/' + pattern;
  else if (pattern.startsWith('/')) pattern = pattern.slice(1);

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

async function _parseFindGitignores(options: Options): Promise<Gitignores> {
  const ignores: string[] = ['.git', ...GLOBAL_IGNORE_PATTERNS];
  const unignores: string[] = [];
  const gitignoreFiles: string[] = [];

  const matcher: picomatch.Matcher = picomatch(ignores, { ignore: unignores });

  const entryFilter = (entry: Entry) => {
    if (entry.dirent.isFile() && entry.name === '.gitignore') {
      gitignoreFiles.push(entry.path);

      const dir = path.dirname(path.toPosix(entry.path));
      const base = path.relative(options.cwd, dir);
      const dirIgnores = base === '' ? ['.git', ...GLOBAL_IGNORE_PATTERNS] : [];
      const dirUnignores = [];

      for (const rule of parseGitignoreFile(entry.path)) {
        const [p, ext] = rule.patterns;
        if (rule.negated) {
          if (base === '') {
            if (!unignores.includes(ext)) dirUnignores.push(...rule.patterns);
          } else {
            if (!unignores.includes(ext.startsWith('**/') ? ext : '**/' + ext)) {
              dirUnignores.push(path.join(base, p), path.join(base, ext));
            }
          }
        } else {
          if (base === '') {
            if (!ignores.includes(ext)) dirIgnores.push(...rule.patterns);
          } else {
            if (!ignores.includes(ext.startsWith('**/') ? ext : '**/' + ext)) {
              dirIgnores.push(path.join(base, p), path.join(base, ext));
            }
          }
        }
      }

      ignores.push(...dirIgnores);
      unignores.push(...dirUnignores);
      cachedIgnores.set(dir, { ignores: dirIgnores, unignores: dirUnignores });

      return true;
    }
    return false;
  };
  const deepFilter = (entry: Entry) => !matcher(path.relative(options.cwd, entry.path));
  await walk(options.cwd, {
    entryFilter: timerify(entryFilter),
    deepFilter: timerify(deepFilter),
  });
  debugLogObject(options.cwd, 'parsed gitignore files', { consideredFiles: gitignoreFiles, ignores, unignores });
  return { ignores, unignores };
}

const parseFindGitignores = timerify(_parseFindGitignores);

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
      dir = path.dirname(dir);
    }
    const i = cachedIgnores.get(options.cwd);
    if (i) ignore.push(...i.ignores);
  }

  debugLogObject(options.cwd, `fastGlobOptions`, { patterns, ...options, ignore });

  return fastGlob(patterns, {
    ...options,
    ignore,
  });
}

/** create a function that should be equivalent to `git check-ignored` */
export async function isGitIgnoredFn(options: Options): Promise<(path: string) => boolean> {
  cachedIgnores.clear();
  if (options.gitignore === false) return () => false;
  const gitignore = await parseFindGitignores(options);
  const matcher = picomatch(gitignore.ignores, { ignore: gitignore.unignores });
  const isGitIgnored = (filePath: string) => {
    const ret = matcher(path.relative(options.cwd, filePath));
    // debugLogObject(filePath, 'isGitIgnored', { path: path.relative(options.cwd, filePath), gitignore });
    return ret;
  };
  return timerify(isGitIgnored);
}
