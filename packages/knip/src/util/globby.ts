import * as fs from 'fs';
import { promisify } from 'node:util';
import { walk as _walk } from '@nodelib/fs.walk';
import { type Options as FastGlobOptions } from 'fast-glob';
import fastGlob from 'fast-glob';
import picomatch from "picomatch"; // TODO: this should potentially be from "picomatch/posix" for windows compat
import { debugLogObject } from './debug.js';
import * as path from './path.js';
import { timerify } from './Performance.js';
import type { Entry } from '@nodelib/fs.walk'

const walk = promisify(_walk);
type Options = {
  /** Respect ignore patterns in `.gitignore` files that apply to the globbed files. */
  readonly gitignore?: boolean;

  /** The current working directory in which to search. */
  readonly cwd: string;
} & FastGlobOptionsWithoutCwd;

type FastGlobOptionsWithoutCwd = Pick<FastGlobOptions, 'onlyDirectories' | 'ignore' | 'absolute' | 'dot'>;

/**
 * micromatch and gitignore use slightly different syntax. convert it.
 * 
 * we can't use the `ignore` npm library because (a) it doesn't support multiple gitignore files and
 * (b) we want to pass the resulting globs to fast-glob which uses micromatch internally.
 */
function convertGitignoreToMicromatch(pattern: string, base: string) {
  let negated = pattern[0] === '!';
  if (negated) {
    pattern = pattern.slice(1);
  }
  const otherPatterns = [];
  // gitignore matches by basename if no slash present
  if (!pattern.includes('/')) pattern = '**/' + pattern;
  // leading slash on git is equivalent to no leading slash in micromatch
  else if (pattern.startsWith('/')) pattern = pattern.slice(1);
  // micromatch does not interpret dirs as matching their children, git does
  if (pattern.endsWith('/')) otherPatterns.push(pattern + '**');
  else otherPatterns.push(pattern + '/**');
  return { negated, patterns: [pattern, ...otherPatterns].map(pattern => path.join(base, pattern)) };
}

/** this function needs to be synchronous currently because the fs.walk library takes a synchronous callback for filtering */
function parseGitignoreFile(filePath: string, cwd: string) {
  const file = fs.readFileSync(filePath, 'utf8');
  const base = path.relative(cwd, path.dirname(filePath));

  return file
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#'))
    .map(pattern => convertGitignoreToMicromatch(pattern, base));
}
/** contains parsed individual gitignore rules from potentially multiple gitignore files */
type Gitignores = { ignores: string[]; unignores: string[] };

/** walks a directory, parsing gitignores and using them directly on the way (early pruning) */
async function _parseFindGitignores(options: Options): Promise<Gitignores> {
  const ignores: string[] = [];
  const unignores: string[] = [];
  const gitignoreFiles: string[] = [];
  // whenever a new gitignore file is found, this matcher is recompiled
  let matcher: picomatch.Matcher = () => true;
  const entryFilter = (entry: Entry) => {
    if (entry.dirent.isFile() && entry.name === '.gitignore') {
      gitignoreFiles.push(entry.path);
      for (const rule of parseGitignoreFile(entry.path, options.cwd))
        if (rule.negated) unignores.push(...rule.patterns);
        else ignores.push(...rule.patterns);
      matcher = picomatch(ignores, { ignore: unignores });
      return true;
    }
    return false;
  };
  const deepFilter = (entry: Entry) => !matcher(path.relative(options.cwd, entry.path))
  // we don't actually care about the result of the walk since we incrementally add the results in entryFilter
  await walk(options.cwd, {
    // when we see a .gitignore, parse and add it
    entryFilter: timerify(entryFilter),
    // early pruning: don't recurse into directories that are ignored (important!)
    deepFilter: timerify(deepFilter),
  });
  debugLogObject(options.cwd, 'parsed gitignore files', { consideredFiles: gitignoreFiles, ignores, unignores });
  return { ignores, unignores };
}

const parseFindGitignores = timerify(_parseFindGitignores);
// since knip parses gitignores only a limited number of times and mostly purely for the repo root, permanent caching should be fine
const cachedIgnores = new Map<string, Gitignores>();

/** load gitignores into memory, with caching */
async function loadGitignores(options: Options): Promise<Gitignores> {
  let gitignore = cachedIgnores.get(options.cwd);
  if (!gitignore) {
    gitignore = await parseFindGitignores(options);
    cachedIgnores.set(options.cwd, gitignore);
  }
  return gitignore;
}
/** simpler and faster replacement for the globby npm library */
export async function globby(patterns: string | string[], options: Options): Promise<string[]> {
  const ignore = options.ignore ?? [];
  if (options.gitignore) {
    const gitignores = await loadGitignores(options);
    // add git ignores to knip explicit ignores
    ignore.push(...gitignores.ignores);
    // add git unignores (!foo/bar).
    // I'm not sure 100% what the behaviour of fast-glob is here. Potentially this will cause it 
    // to have git unignores to take precedence over knip ignores.
    ignore.push(...gitignores.unignores.map(e => '!' + e));
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
  const gitignore = await loadGitignores(options);
  const matcher = picomatch(gitignore.ignores, { ignore: gitignore.unignores });
  const isGitIgnored = (filePath: string) => {
    const ret = matcher(path.relative(options.cwd, filePath));
    // debugLogObject(filePath, 'isGitIgnored', { path: path.relative(options.cwd, filePath), gitignore });
    return ret;
  };
  return timerify(isGitIgnored);
}
