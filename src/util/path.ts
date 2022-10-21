import path from 'node:path';
import type { globby, Options } from 'globby';

const cwd = process.cwd();

export const relative = (to: string) => path.relative(cwd, to);

let _globby: typeof globby;
const glob = async function (patterns: readonly string[], options: Options) {
  if (!_globby) {
    const { globby } = await (eval('import("globby")') as Promise<typeof import('globby')>);
    _globby = globby;
  }
  return _globby(patterns, options);
};

const prependDirToPattern = (workingDir: string, pattern: string) => {
  if (pattern.startsWith('!')) return '!' + path.join(workingDir, pattern.slice(1));
  return path.join(workingDir, pattern);
};

export const resolvePaths = async ({
  workingDir,
  patterns,
  ignore,
  gitignore,
}: {
  workingDir: string;
  patterns: string[];
  ignore: string[];
  gitignore: boolean;
}) =>
  glob(
    // Prepend relative --dir to patterns to use cwd (not workingDir), because
    // we want to glob everything to include all (git)ignore patterns
    patterns.map(pattern => prependDirToPattern(relative(workingDir), pattern)),
    {
      cwd,
      ignore: [...ignore, '**/node_modules'],
      gitignore,
      absolute: true,
    }
  );
