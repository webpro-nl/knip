import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { type Entry, walk as _walk } from '@nodelib/fs.walk';
import fg, { type Options as FastGlobOptions } from 'fast-glob';
import picomatch from 'picomatch';
import { GLOBAL_IGNORE_PATTERNS, ROOT_WORKSPACE_NAME } from '../constants.js';
import { timerify } from './Performance.js';
import { debugLogObject } from './debug.js';
import { isFile } from './fs.js';
import { dirname, join, relative, toPosix } from './path.js';

const walk = promisify(_walk);

const _picomatch = timerify(picomatch);

type Options = { gitignore: boolean; cwd: string };

type GlobOptions = {
  readonly gitignore: boolean;
  readonly cwd: string;
  readonly dir: string;
} & FastGlobOptionsWithoutCwd;

type FastGlobOptionsWithoutCwd = Pick<FastGlobOptions, 'onlyDirectories' | 'ignore' | 'absolute' | 'dot'>;

type Gitignores = { ignores: Set<string>; unignores: string[] };

const cachedIgnores = new Map<string, Gitignores>();

/** @internal */
export const convertGitignoreToPicomatchIgnorePatterns = (pattern: string) => {
  const negated = pattern[0] === '!';

  if (negated) pattern = pattern.slice(1);

  let extPattern: string;

  if (pattern.endsWith('/')) pattern = pattern.slice(0, -1);
  if (pattern.startsWith('*/**/')) pattern = pattern.slice(5);

  if (pattern.startsWith('/')) pattern = pattern.slice(1);
  else if (!pattern.startsWith('**/')) pattern = `**/${pattern}`;

  if (pattern.endsWith('/*')) extPattern = pattern;
  else extPattern = `${pattern}/**`;

  return { negated, patterns: [pattern, extPattern] };
};

/** @internal */
export const parseAndConvertGitignorePatterns = (patterns: string, ancestor?: string) => {
  const matchFrom = ancestor ? new RegExp(`^(!?/?)(${ancestor})`) : undefined;
  return patterns
    .split(/\r?\n/)
    .filter(line => line.trim() && !line.startsWith('#'))
    .flatMap(line => {
      const pattern = line.replace(/(?<!\\)#.*/, '').trim();
      if (ancestor && matchFrom) {
        if (pattern.match(matchFrom)) return [pattern.replace(matchFrom, '$1')];
        if (pattern.startsWith('/**/')) return [pattern.slice(1)];
        if (pattern.startsWith('!/**/')) return [`!${pattern.slice(2)}`];
        if (pattern.startsWith('/') || pattern.startsWith('!/')) return [];
      }
      return [pattern];
    })
    .map(pattern => convertGitignoreToPicomatchIgnorePatterns(pattern));
};

const findAncestorGitignoreFiles = (cwd: string): string[] => {
  const gitignorePaths: string[] = [];
  let dir = dirname(cwd);
  let prev: string;
  while (dir) {
    const filePath = join(dir, '.gitignore');
    if (isFile(filePath)) gitignorePaths.push(filePath);
    // biome-ignore lint/suspicious/noAssignInExpressions: deal with it
    dir = dirname((prev = dir));
    if (prev === dir || dir === '.') break;
  }
  return gitignorePaths;
};

/** @internal */
export const findAndParseGitignores = async (cwd: string) => {
  const init = ['.git', ...GLOBAL_IGNORE_PATTERNS];
  const ignores: Set<string> = new Set(init);
  const unignores: string[] = [];
  const gitignoreFiles: string[] = [];
  const pmOptions = { ignore: unignores };

  // Warning: earlier matchers don't include later unignores (perf win, but can't unignore from ancestor gitignores)
  const matchers = new Set(init.map(pattern => _picomatch(pattern, pmOptions)));

  const matcher = (str: string) => {
    for (const isMatch of matchers) {
      const state = isMatch(str);
      if (state) return state;
    }
    return false;
  };

  const addFile = (filePath: string) => {
    gitignoreFiles.push(relative(cwd, filePath));

    const dir = dirname(toPosix(filePath));
    const base = relative(cwd, dir);
    const ancestor = base.startsWith('..') ? `${relative(dir, cwd)}/` : undefined;
    const dirIgnores = new Set(base === '' ? init : []);
    const dirUnignores = new Set<string>();

    const patterns = readFileSync(filePath, 'utf8');

    for (const rule of parseAndConvertGitignorePatterns(patterns, ancestor)) {
      const [pattern, extraPattern] = rule.patterns;
      if (rule.negated) {
        if (base === '' || base.startsWith('..')) {
          if (!unignores.includes(extraPattern)) {
            unignores.push(...rule.patterns);
            dirUnignores.add(pattern);
            dirUnignores.add(extraPattern);
          }
        } else {
          if (!unignores.includes(extraPattern.startsWith('**/') ? extraPattern : `**/${extraPattern}`)) {
            const unignore = join(base, pattern);
            const extraUnignore = join(base, extraPattern);
            unignores.push(unignore, extraUnignore);
            dirUnignores.add(unignore);
            dirUnignores.add(extraUnignore);
          }
        }
      } else {
        if (base === '' || base.startsWith('..')) {
          if (!ignores.has(extraPattern)) {
            ignores.add(pattern);
            ignores.add(extraPattern);
            dirIgnores.add(pattern);
            dirIgnores.add(extraPattern);
          }
        } else {
          if (!ignores.has(extraPattern.startsWith('**/') ? extraPattern : `**/${extraPattern}`)) {
            const ignore = join(base, pattern);
            const extraIgnore = join(base, extraPattern);
            ignores.add(ignore);
            ignores.add(extraIgnore);
            dirIgnores.add(ignore);
            dirIgnores.add(extraIgnore);
          }
        }
      }
    }

    const cacheDir = ancestor ? cwd : dir;
    const cacheForDir = cachedIgnores.get(cwd);

    if (ancestor && cacheForDir) {
      for (const pattern of dirIgnores) cacheForDir?.ignores.add(pattern);
      cacheForDir.unignores = Array.from(new Set([...cacheForDir.unignores, ...dirUnignores]));
    } else {
      cachedIgnores.set(cacheDir, { ignores: dirIgnores, unignores: Array.from(dirUnignores) });
    }

    for (const pattern of dirIgnores) matchers.add(_picomatch(pattern, pmOptions));
  };

  findAncestorGitignoreFiles(cwd).forEach(addFile);

  if (isFile('.git/info/exclude')) addFile('.git/info/exclude');

  const entryFilter = (entry: Entry) => {
    if (entry.dirent.isFile() && entry.name === '.gitignore') {
      addFile(entry.path);
      return true;
    }
    return false;
  };

  const deepFilter = (entry: Entry) => !matcher(relative(cwd, entry.path));

  await walk(cwd, {
    entryFilter: timerify(entryFilter),
    deepFilter: timerify(deepFilter),
  });

  debugLogObject('*', 'Parsed gitignore files', { gitignoreFiles, ignores, unignores });

  return { gitignoreFiles, ignores, unignores };
};

const _parseFindGitignores = timerify(findAndParseGitignores);

export async function globby(patterns: string | string[], options: GlobOptions): Promise<string[]> {
  if (Array.isArray(patterns) && patterns.length === 0) return [];

  const ignore = options.gitignore && Array.isArray(options.ignore) ? [...options.ignore] : [];

  if (options.gitignore) {
    let dir = options.dir;
    let prev: string;
    while (dir) {
      const cacheForDir = cachedIgnores.get(dir);
      if (cacheForDir) {
        // fast-glob doesn't support negated patterns in `ignore` (i.e. unignores are.. ignored): https://github.com/mrmlnc/fast-glob/issues/86
        ignore.push(...cacheForDir.ignores);
      }
      // biome-ignore lint/suspicious/noAssignInExpressions: deal with it
      dir = dirname((prev = dir));
      if (prev === dir || dir === '.') break;
    }
  } else {
    ignore.push(...GLOBAL_IGNORE_PATTERNS);
  }

  const fgOptions = Object.assign(options, { ignore });

  debugLogObject(relative(options.cwd, options.dir) || ROOT_WORKSPACE_NAME, 'Glob options', { patterns, ...fgOptions });

  return fg.glob(patterns, fgOptions);
}

export async function getGitIgnoredHandler(options: Options): Promise<(path: string) => boolean> {
  cachedIgnores.clear();

  if (options.gitignore === false) return () => false;

  const gitignore = await _parseFindGitignores(options.cwd);
  const matcher = _picomatch(Array.from(gitignore.ignores), { ignore: gitignore.unignores });

  const isGitIgnored = (filePath: string) => matcher(relative(options.cwd, filePath));

  return timerify(isGitIgnored);
}
