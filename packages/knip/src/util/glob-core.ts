import { readFileSync } from 'node:fs';
// oxlint-disable-next-line no-restricted-imports
import { basename } from 'node:path';
import { fdir } from 'fdir';
import { glob as tinyGlob, type GlobOptions as TinyGlobOptions } from 'tinyglobby';
import picomatch from 'picomatch';
import { GLOBAL_IGNORE_PATTERNS } from '../constants.ts';
import { compact, partition } from './array.ts';
import { debugLogObject } from './debug.ts';
import { isDirectory, isFile } from './fs.ts';
import { getCachedGitignore, isGitignoreCacheEnabled, setCachedGitignore } from './gitignore-cache.ts';
import { timerify } from './Performance.ts';
import { expandIgnorePatterns, parseAndConvertGitignorePatterns } from './parse-and-convert-gitignores.ts';
import { dirname, isAbsolute, join, relative, toPosix } from './path.ts';

type Options = { gitignore: boolean; cwd: string };

interface GlobOptions extends TinyGlobOptions {
  gitignore: boolean;
  cwd: string;
  dir: string;
  label?: string;
}

export type Gitignores = { ignores: Set<string>; unignores: Set<string> };

// ignore patterns are cached per gitignore file
const cachedGitIgnores = new Map<string, Gitignores>();
// ignore patterns are cached per directory as a product of .gitignore in current and ancestor directories
const cachedGlobIgnores = new Map<string, string[]>();

let gitignoreReconciler: ((absPath: string) => boolean) | undefined;

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
    // oxlint-disable-next-line no-cond-assign
    dir = dirname((prev = dir));
    if (prev === dir || dir === '.') break;
  }
  return gitignorePaths;
};

/** @internal */
export const findAndParseGitignores = async (cwd: string, workspaceDirs?: Set<string>) => {
  if (isGitignoreCacheEnabled()) {
    const cached = getCachedGitignore(cwd, workspaceDirs);
    if (cached) {
      for (const [dir, data] of cached.perDirIgnores) cachedGitIgnores.set(dir, data);
      debugLogObject('*', 'Parsed gitignore files (cached)', { gitignoreFiles: cached.gitignoreFiles });
      return { gitignoreFiles: cached.gitignoreFiles, ignores: cached.ignores, unignores: cached.unignores };
    }
  }

  const ignores: Set<string> = new Set(GLOBAL_IGNORE_PATTERNS);
  const unignores: Set<string> = new Set();
  const gitignoreFiles: string[] = [];

  let deepFilterMatcher: ((str: string) => boolean) | undefined;
  let prevUnignoreSize = unignores.size;
  let unignoresArray: string[] = [];
  const pendingIgnores: string[] = [];

  const getMatcher = () => {
    if (!deepFilterMatcher) {
      unignoresArray = Array.from(unignores);
      deepFilterMatcher = picomatch(Array.from(ignores), { ignore: unignoresArray });
      pendingIgnores.length = 0;
    } else if (pendingIgnores.length > 0) {
      const prev = deepFilterMatcher;
      const incr = picomatch(pendingIgnores.splice(0), { ignore: unignoresArray });
      deepFilterMatcher = (path: string) => prev(path) || incr(path);
    }
    return deepFilterMatcher;
  };

  const addFile = (filePath: string, baseDir?: string) => {
    gitignoreFiles.push(relative(cwd, filePath));

    const dir = baseDir ?? dirname(toPosix(filePath));
    const base = relative(cwd, dir);
    const ancestor = base.startsWith('..') ? `${relative(dir, cwd)}/` : undefined;

    const ignoresForDir = new Set(base === '' ? GLOBAL_IGNORE_PATTERNS : []);
    const unignoresForDir = new Set<string>();
    const prevIgnoreSize = ignores.size;

    const patterns = readFileSync(filePath, 'utf8');

    const isRoot = base === '' || base.startsWith('..');
    for (const { negated, pattern } of parseAndConvertGitignorePatterns(patterns, ancestor)) {
      if (negated) {
        if (isRoot) {
          if (!unignores.has(pattern)) {
            unignores.add(pattern);
            unignoresForDir.add(pattern);
          }
        } else if (!unignores.has(pattern)) {
          const unignore = join(base, pattern);
          unignores.add(unignore);
          unignoresForDir.add(unignore);
        }
      } else if (isRoot) {
        ignores.add(pattern);
        ignoresForDir.add(pattern);
      } else if (!unignores.has(pattern)) {
        const ignore = join(base, pattern);
        ignores.add(ignore);
        ignoresForDir.add(ignore);
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

    if (unignores.size !== prevUnignoreSize) {
      deepFilterMatcher = undefined;
      prevUnignoreSize = unignores.size;
    } else if (ignores.size !== prevIgnoreSize) {
      for (const p of ignoresForDir) if (!GLOBAL_IGNORE_PATTERNS.includes(p)) pendingIgnores.push(p);
    }
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

  const cwdPrefixLen = cwd.length + 1;
  const walkGitignores = async () => {
    await new fdir()
      .withFullPaths()
      .exclude((_dirName: string, dirPath: string) => {
        const absPath = toPosix(dirPath.slice(0, -1));
        return (isRelevantDir && !isRelevantDir(absPath)) || getMatcher()(absPath.slice(cwdPrefixLen));
      })
      .filter((filePath: string, isDir: boolean) => {
        if (isDir || basename(filePath) !== '.gitignore') return false;
        addFile(filePath);
        return true;
      })
      .crawl(cwd)
      .withPromise();
  };

  await walkGitignores();

  // tinyglobby's `ignore` can't express unignores (see tinyglobby/fast-glob #86). Drop cached
  // ignore patterns shadowed by any unignore path (and its ancestor dirs) so glob() sees a
  // safe-to-use flat list — the walk above already respects unignores via picomatch directly.
  //
  // Example: a yarn-berry `.gitignore` with `.yarn/*` + `!.yarn/plugins` yields ignore
  // `**/.yarn/*` and unignore `**/.yarn/plugins`. Without this filter tinyglobby would prune
  // `.yarn/plugins` during traversal; here we drop `**/.yarn/*` since it shadows the unignore.
  if (unignores.size > 0) {
    const unignorePaths = new Set<string>();
    for (const u of unignores) {
      let p = u.replace(/^\*\*\//, '');
      while (p && p !== '.' && p !== '/') {
        unignorePaths.add(p);
        const parent = dirname(p);
        if (parent === p) break;
        p = parent;
      }
    }
    // Whether a pattern is shadowed depends only on the pattern, not the dir, so memoize the
    // picomatch compile+test across the (often identical) patterns repeated in per-dir caches.
    const isShadowed = new Map<string, boolean>();
    for (const cacheForDir of cachedGitIgnores.values()) {
      for (const pattern of cacheForDir.ignores) {
        let shadowed = isShadowed.get(pattern);
        if (shadowed === undefined) {
          const match = picomatch(pattern);
          shadowed = false;
          for (const p of unignorePaths) {
            if (match(p)) {
              shadowed = true;
              break;
            }
          }
          isShadowed.set(pattern, shadowed);
        }
        if (shadowed) cacheForDir.ignores.delete(pattern);
      }
    }
  }

  debugLogObject('*', 'Parsed gitignore files', { gitignoreFiles });

  if (isGitignoreCacheEnabled()) {
    setCachedGitignore(cwd, workspaceDirs, gitignoreFiles, ignores, unignores, cachedGitIgnores);
  }

  return { gitignoreFiles, ignores, unignores };
};

const _parseFindGitignores = timerify(findAndParseGitignores);

export async function glob(_patterns: string[], options: GlobOptions): Promise<string[]> {
  if (Array.isArray(_patterns) && _patterns.length === 0) return [];

  const cachedIgnores = options.gitignore ? cachedGlobIgnores.get(options.dir) : undefined;

  const _ignore: string[] = [...GLOBAL_IGNORE_PATTERNS];
  const [negatedPatterns, patterns] = partition(_patterns, pattern => pattern.startsWith('!'));

  if (!cachedIgnores && options.gitignore && options.label) {
    let dir = options.dir;
    let prev: string;
    while (dir) {
      const cacheForDir = cachedGitIgnores.get(dir);
      if (cacheForDir) _ignore.push(...cacheForDir.ignores);
      // oxlint-disable-next-line no-cond-assign
      dir = dirname((prev = dir));
      if (prev === dir || dir === '.') break;
    }
    cachedGlobIgnores.set(options.dir, compact(_ignore));
  }

  const ignorePatterns = (cachedIgnores ?? _ignore).concat(negatedPatterns.map(pattern => pattern.slice(1)));

  const { dir, label, ...fgOptions } = { ...options, ignore: ignorePatterns, expandDirectories: false };

  const paths = await tinyGlob(patterns, fgOptions);

  debugLogObject(relative(options.cwd, dir), label ? `Finding ${label}` : 'Finding paths', () => ({
    patterns,
    ...fgOptions,
    ignore:
      cachedIgnores && negatedPatterns.length === 0
        ? `// using cache from previous glob cwd: ${fgOptions.cwd}`
        : ignorePatterns,
    paths,
  }));

  return paths;
}

export function reconcileGitignoredPaths(paths: string[], cwd: string): string[] {
  if (!gitignoreReconciler || paths.length === 0) return paths;
  const isGitIgnored = gitignoreReconciler;
  const result: string[] = [];
  for (const path of paths) if (!isGitIgnored(isAbsolute(path) ? path : join(cwd, path))) result.push(path);
  return result;
}

export async function getGitIgnoredHandler(
  options: Options,
  workspaceDirs?: Set<string>
): Promise<(path: string) => boolean> {
  cachedGitIgnores.clear();
  gitignoreReconciler = undefined;

  if (options.gitignore === false) return () => false;

  const { ignores, unignores } = await _parseFindGitignores(options.cwd, workspaceDirs);
  const matcher = picomatch(expandIgnorePatterns(ignores), { ignore: expandIgnorePatterns(unignores) });

  const cache = new Map<string, boolean>();
  const isGitIgnored = (filePath: string) => {
    let result = cache.get(filePath);
    if (result === undefined) {
      result = matcher(relative(options.cwd, filePath));
      cache.set(filePath, result);
    }
    return result;
  };

  if (unignores.size > 0) gitignoreReconciler = isGitIgnored;

  return isGitIgnored;
}
