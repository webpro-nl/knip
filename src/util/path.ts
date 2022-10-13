import path from 'node:path';
import type { globby, Options } from 'globby';

let _globby: typeof globby;
const glob = async function (patterns: readonly string[], options: Options) {
  if (!_globby) {
    const { globby } = await (eval('import("globby")') as Promise<typeof import('globby')>);
    _globby = globby;
  }
  return _globby(patterns, options);
};

export const prependDirToPattern = (workingDir: string, pattern: string) => {
  if (pattern.startsWith('!')) return '!' + path.join(workingDir, pattern.slice(1));
  return path.join(workingDir, pattern);
};

export const resolvePaths = async ({
  cwd,
  workingDir,
  patterns,
  ignore,
  gitignore,
}: {
  cwd: string;
  workingDir: string;
  patterns: string[];
  ignore: string[];
  gitignore: boolean;
}) =>
  glob(
    // Prepend relative --dir to patterns to use cwd (not workingDir), because
    // we want to glob everything to include all (git)ignore patterns
    patterns.map(pattern => prependDirToPattern(path.relative(cwd, workingDir), pattern)),
    {
      cwd,
      ignore,
      gitignore,
      absolute: true,
    }
  );
