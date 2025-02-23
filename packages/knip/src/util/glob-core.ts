import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { type Entry, walk as _walk } from '@nodelib/fs.walk';
import fg, { type Options as FastGlobOptions } from 'fast-glob';
import picomatch from 'picomatch';
import { GLOBAL_IGNORE_PATTERNS, ROOT_WORKSPACE_NAME } from '../constants.js';
import { timerify } from './Performance.js';
import { compact } from './array.js';
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
  label?: string;
} & FastGlobOptionsWithoutCwd;

type FastGlobOptionsWithoutCwd = Pick<FastGlobOptions, 'onlyDirectories' | 'ignore' | 'absolute' | 'dot'>;

type Gitignores = { ignores: Set<string>; unignores: string[] };

const cachedGitIgnores = new Map<string, Gitignores>();
const cachedGlobIgnores = new Map<string, string[]>();

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
      const pattern = line.replace(/^\\(?=#)/, '').trim();
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
      const [pattern1, pattern2] = rule.patterns;
      if (rule.negated) {
        if (base === '' || base.startsWith('..')) {
          if (!unignores.includes(pattern2)) {
            unignores.push(...rule.patterns);
            dirUnignores.add(pattern1);
            dirUnignores.add(pattern2);
          }
        } else {
          if (!unignores.includes(pattern2.startsWith('**/') ? pattern2 : `**/${pattern2}`)) {
            const unignore = join(base, pattern1);
            const extraUnignore = join(base, pattern2);
            unignores.push(unignore, extraUnignore);
            dirUnignores.add(unignore);
            dirUnignores.add(extraUnignore);
          }
        }
      } else {
        if (base === '' || base.startsWith('..')) {
          ignores.add(pattern1);
          ignores.add(pattern2);
          dirIgnores.add(pattern1);
          dirIgnores.add(pattern2);
        } else {
          const ignore = join(base, pattern1);
          const extraIgnore = join(base, pattern2);
          ignores.add(ignore);
          ignores.add(extraIgnore);
          dirIgnores.add(ignore);
          dirIgnores.add(extraIgnore);
        }
      }
    }

    const cacheDir = ancestor ? cwd : dir;
    const cacheForDir = cachedGitIgnores.get(cwd);

    if (ancestor && cacheForDir) {
      for (const pattern of dirIgnores) cacheForDir?.ignores.add(pattern);
      cacheForDir.unignores = Array.from(new Set([...cacheForDir.unignores, ...dirUnignores]));
    } else {
      cachedGitIgnores.set(cacheDir, { ignores: dirIgnores, unignores: Array.from(dirUnignores) });
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

  debugLogObject('*', 'Parsed gitignore files', { gitignoreFiles });

  return { gitignoreFiles, ignores, unignores };
};

const _parseFindGitignores = timerify(findAndParseGitignores);

export async function glob(patterns: string | string[], options: GlobOptions): Promise<string[]> {
  if (Array.isArray(patterns) && patterns.length === 0) return [];

  const canCache = options.label && options.gitignore;
  const willCache = canCache && !cachedGlobIgnores.has(options.dir);
  const cachedIgnores = canCache && cachedGlobIgnores.get(options.dir);

  const _ignore = options.gitignore && Array.isArray(options.ignore) ? [...options.ignore] : [];

  if (options.gitignore) {
    if (willCache) {
      let dir = options.dir;
      let prev: string;
      while (dir) {
        const cacheForDir = cachedGitIgnores.get(dir);
        if (cacheForDir) {
          // fast-glob doesn't support negated patterns in `ignore` (i.e. unignores are.. ignored): https://github.com/mrmlnc/fast-glob/issues/86
          _ignore.push(...cacheForDir.ignores);
        }
        // biome-ignore lint/suspicious/noAssignInExpressions: deal with it
        dir = dirname((prev = dir));
        if (prev === dir || dir === '.') break;
      }
    }
  } else {
    _ignore.push(...GLOBAL_IGNORE_PATTERNS);
  }

  const ignore = cachedIgnores || compact(_ignore);

  const { dir, label, ...fgOptions } = { ...options, ignore };

  const paths = await fg.glob(patterns, fgOptions);

  debugLogObject(
    relative(options.cwd, dir) || ROOT_WORKSPACE_NAME,
    label ? `Finding ${label} paths` : 'Finding paths',
    () => ({ patterns, ...fgOptions, ignore: cachedIgnores ? `// identical to ${dir}` : ignore, paths })
  );

  if (willCache) cachedGlobIgnores.set(options.dir, ignore);

  return paths;
}

export async function getGitIgnoredHandler(options: Options): Promise<(path: string) => boolean> {
  cachedGitIgnores.clear();

  if (options.gitignore === false) return () => false;

  const gitignore = await _parseFindGitignores(options.cwd);
  const matcher = _picomatch(Array.from(gitignore.ignores), { ignore: gitignore.unignores });

  const isGitIgnored = (filePath: string) => matcher(relative(options.cwd, filePath));

  return timerify(isGitIgnored);
}
