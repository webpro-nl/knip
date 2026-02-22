import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { walk as _walk, type Entry } from '@nodelib/fs.walk';
import fg, { type Options as FastGlobOptions } from 'fast-glob';
import picomatch from 'picomatch';
import { GLOBAL_IGNORE_PATTERNS } from '../constants.ts';
import { compact, partition } from './array.ts';
import { debugLogObject } from './debug.ts';
import { isDirectory, isFile } from './fs.ts';
import { timerify } from './Performance.ts';
import { parseAndConvertGitignorePatterns } from './parse-and-convert-gitignores.ts';
import { dirname, join, relative, toPosix } from './path.ts';

const walk = promisify(_walk);

const _picomatch = timerify(picomatch);

type Options = { gitignore: boolean; cwd: string };

interface GlobOptions extends FastGlobOptions {
  gitignore: boolean;
  cwd: string;
  dir: string;
  label?: string;
}

type Gitignores = { ignores: Set<string>; unignores: Set<string> };

// ignore patterns are cached per gitignore file
const cachedGitIgnores = new Map<string, Gitignores>();
// ignore patterns are cached per directory as a product of .gitignore in current and ancestor directories
const cachedGlobIgnores = new Map<string, string[]>();

// Check if directory is a git root (has .git directory or .git file for worktrees)
const isGitRoot = (dir: string) => isDirectory(dir, '.git') || isFile(dir, '.git');

// Get the git directory path, handling worktrees where .git is a file containing "gitdir: /path/to/git/dir"
const getGitDir = (cwd: string): string | undefined => {
  const dotGit = join(cwd, '.git');
  if (isDirectory(dotGit)) return dotGit;
  if (isFile(dotGit)) {
    const content = readFileSync(dotGit, 'utf8').trim();
    const match = content.match(/^gitdir:\s*(.+)$/);
    if (match) return join(cwd, match[1]);
  }
  return undefined;
};

const findAncestorGitignoreFiles = (cwd: string): string[] => {
  const gitignorePaths: string[] = [];
  if (isGitRoot(cwd)) return gitignorePaths;
  let dir = dirname(cwd);
  let prev: string;
  while (dir) {
    const filePath = join(dir, '.gitignore');
    if (isFile(filePath)) gitignorePaths.push(filePath);
    if (isGitRoot(dir)) break;
    // biome-ignore lint: suspicious/noAssignInExpressions
    dir = dirname((prev = dir));
    if (prev === dir || dir === '.') break;
  }
  return gitignorePaths;
};

/** @internal */
export const findAndParseGitignores = async (cwd: string, workspaceDirs?: Set<string>) => {
  const init = ['.git', ...GLOBAL_IGNORE_PATTERNS];
  const ignores: Set<string> = new Set(init);
  const unignores: string[] = [];
  const gitignoreFiles: string[] = [];
  const pmOptions = { ignore: unignores };

  let deepFilterMatcher: ((str: string) => boolean) | undefined;

  const getMatcher = () => {
    if (!deepFilterMatcher) deepFilterMatcher = _picomatch(Array.from(ignores), pmOptions);
    return deepFilterMatcher;
  };

  const addFile = (filePath: string, baseDir?: string) => {
    gitignoreFiles.push(relative(cwd, filePath));

    const dir = baseDir ?? dirname(toPosix(filePath));
    const base = relative(cwd, dir);
    const ancestor = base.startsWith('..') ? `${relative(dir, cwd)}/` : undefined;

    const ignoresForDir = new Set(base === '' ? init : []);
    const unignoresForDir = new Set<string>();

    const patterns = readFileSync(filePath, 'utf8');

    for (const rule of parseAndConvertGitignorePatterns(patterns, ancestor)) {
      const [pattern, extraPattern] = rule.patterns;
      if (rule.negated) {
        if (base === '' || base.startsWith('..')) {
          if (!unignores.includes(extraPattern)) {
            unignores.push(...rule.patterns);
            unignoresForDir.add(pattern);
            unignoresForDir.add(extraPattern);
          }
        } else {
          if (!unignores.includes(extraPattern.startsWith('**/') ? extraPattern : `**/${extraPattern}`)) {
            const unignore = join(base, pattern);
            const extraUnignore = join(base, extraPattern);
            unignores.push(unignore, extraUnignore);
            unignoresForDir.add(unignore);
            unignoresForDir.add(extraUnignore);
          }
        }
      } else {
        if (base === '' || base.startsWith('..')) {
          ignores.add(pattern);
          ignores.add(extraPattern);
          ignoresForDir.add(pattern);
          ignoresForDir.add(extraPattern);
        } else if (!unignores.includes(extraPattern.startsWith('**/') ? extraPattern : `**/${extraPattern}`)) {
          const ignore = join(base, pattern);
          const extraIgnore = join(base, extraPattern);
          ignores.add(ignore);
          ignores.add(extraIgnore);
          ignoresForDir.add(ignore);
          ignoresForDir.add(extraIgnore);
        }
      }
    }

    const cacheDir = ancestor ? cwd : dir;
    const cacheForDir = cachedGitIgnores.get(cacheDir);

    if (cacheForDir) {
      for (const pattern of ignoresForDir) cacheForDir.ignores.add(pattern);
      for (const pattern of unignoresForDir) cacheForDir.unignores.add(pattern);
    } else {
      cachedGitIgnores.set(cacheDir, { ignores: ignoresForDir, unignores: unignoresForDir });
    }

    deepFilterMatcher = undefined;
  };

  for (const filePath of findAncestorGitignoreFiles(cwd)) addFile(filePath);

  const gitDir = getGitDir(cwd);
  if (gitDir) {
    const excludePath = join(gitDir, 'info/exclude');
    if (isFile(excludePath)) addFile(excludePath, cwd);
  }

  // Precompute relevant directories from workspace dirs to avoid walking irrelevant subtrees (e.g. generated output dirs)
  let isRelevantDir: ((absPath: string) => boolean) | undefined;
  if (workspaceDirs && workspaceDirs.size > 0) {
    const relevantAncestors = new Set<string>();
    const nonRootDirs = new Set<string>();
    for (const wsDir of workspaceDirs) {
      if (wsDir !== cwd) nonRootDirs.add(wsDir);
      let dir = wsDir;
      while (dir.length >= cwd.length) {
        relevantAncestors.add(dir);
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    }
    if (nonRootDirs.size > 0) {
      isRelevantDir = (absPath: string) => {
        if (relevantAncestors.has(absPath)) return true;
        for (const wsDir of nonRootDirs) if (absPath.startsWith(`${wsDir}/`)) return true;
        return false;
      };
    }
  }

  const entryFilter = (entry: Entry) => {
    if (entry.dirent.isFile() && entry.name === '.gitignore') {
      addFile(entry.path);
      return true;
    }
    return false;
  };

  const deepFilter = (entry: Entry) =>
    (!isRelevantDir || isRelevantDir(toPosix(entry.path))) && !getMatcher()(relative(cwd, entry.path));

  await walk(cwd, {
    concurrency: 16,
    entryFilter: timerify(entryFilter),
    deepFilter: timerify(deepFilter),
  });

  debugLogObject('*', 'Parsed gitignore files', { gitignoreFiles });

  return { gitignoreFiles, ignores, unignores };
};

const _parseFindGitignores = timerify(findAndParseGitignores);

export async function glob(_patterns: string[], options: GlobOptions): Promise<string[]> {
  if (Array.isArray(_patterns) && _patterns.length === 0) return [];

  const hasCache = cachedGlobIgnores.has(options.dir);
  const willCache = !hasCache && options.gitignore && options.label;
  const cachedIgnores = options.gitignore ? cachedGlobIgnores.get(options.dir) : undefined;

  const _ignore: string[] = [];
  const [negatedPatterns, patterns] = partition(_patterns, pattern => pattern.startsWith('!'));

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
        // biome-ignore lint: suspicious/noAssignInExpressions
        dir = dirname((prev = dir));
        if (prev === dir || dir === '.') break;
      }
    }
  } else {
    _ignore.push(...GLOBAL_IGNORE_PATTERNS);
  }

  if (willCache) cachedGlobIgnores.set(options.dir, compact(_ignore));

  const ignorePatterns = (cachedIgnores || _ignore).concat(negatedPatterns.map(pattern => pattern.slice(1)));

  const { dir, label, ...fgOptions } = { ...options, ignore: ignorePatterns };

  const paths = await fg.glob(patterns, fgOptions);

  debugLogObject(relative(options.cwd, dir), label ? `Finding ${label}` : 'Finding paths', () => ({
    patterns,
    ...fgOptions,
    ignore:
      hasCache && ignorePatterns.length === (cachedIgnores || _ignore).length
        ? `// using cache from previous glob cwd: ${fgOptions.cwd}`
        : ignorePatterns,
    paths,
  }));

  return paths;
}

export async function getGitIgnoredHandler(
  options: Options,
  workspaceDirs?: Set<string>
): Promise<(path: string) => boolean> {
  cachedGitIgnores.clear();

  if (options.gitignore === false) return () => false;

  const { ignores, unignores } = await _parseFindGitignores(options.cwd, workspaceDirs);
  const matcher = _picomatch(Array.from(ignores), { ignore: unignores });

  const isGitIgnored = (filePath: string) => matcher(relative(options.cwd, filePath));

  return timerify(isGitIgnored);
}
