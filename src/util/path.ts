import path from 'node:path';
import { globby } from 'globby';

export const prependDirToPattern = (workingDir: string, pattern: string) => {
  if (pattern.startsWith('!')) return '!' + path.join(workingDir, pattern.slice(1));
  return path.join(workingDir, pattern);
};

export const resolvePaths = ({
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
  globby(
    patterns.map(pattern => prependDirToPattern(path.relative(cwd, workingDir), pattern)),
    {
      cwd,
      ignore,
      gitignore,
      absolute: true,
    }
  );
