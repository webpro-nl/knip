import path from 'node:path';
import { globby } from 'globby';

const ensurePosixPath = (value: string) => value.split(path.sep).join(path.posix.sep);

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
  const cwdPosix = ensurePosixPath(cwd);
  const workingDirPosix = ensurePosixPath(workingDir);

  return globby(
    // Prepend relative --dir to patterns to use cwd (not workingDir), because
    // we want to glob everything to include all (git)ignore patterns
    patterns.map(pattern => prependDirToPattern(path.posix.relative(cwdPosix, workingDirPosix), pattern)),
    {
      cwd,
      ignore: [...ignore, '**/node_modules/**'],
      gitignore,
      absolute: true,
    }
  );
};
