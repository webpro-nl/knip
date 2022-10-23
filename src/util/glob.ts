import path from 'node:path';
import type { globby, Options } from 'globby';

let _globby: typeof globby;
const globProxy = async function (patterns: readonly string[], options: Options) {
  if (!_globby) {
    const { globby } = await (eval('import("globby")') as Promise<typeof import('globby')>);
    _globby = globby;
  }
  return _globby(patterns, options);
};

const prependDirToPattern = (workingDir: string, pattern: string) => {
  if (pattern.startsWith('!')) return '!' + path.posix.join(workingDir, pattern.slice(1));
  return path.posix.join(workingDir, pattern);
};

export const glob = async ({
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
}) => {
  return globProxy(
    // Prepend relative --dir to patterns to use cwd (not workingDir), because
    // we want to glob everything to include all (git)ignore patterns
    patterns.map(pattern => prependDirToPattern(path.posix.relative(cwd, workingDir), pattern)),
    {
      cwd,
      ignore: [...ignore, '**/node_modules/**'],
      gitignore,
      absolute: true,
    }
  );
};
