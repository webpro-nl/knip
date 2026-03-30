import { execSync } from 'node:child_process';
import { join } from './path.ts';

// TODO More hooks exists, but is it worth adding all of them?
// https://git-scm.com/docs/githooks
// https://github.com/fisker/git-hooks-list/blob/main/index.json

const hookFileNames = [
  'prepare-commit-msg',
  'commit-msg',
  'pre-{applypatch,commit,merge-commit,push,rebase,receive}',
  'post-{checkout,commit,merge,rewrite}',
];

const getGitHooksPath = (defaultPath = '.git/hooks', cwd: string | undefined) => {
  try {
    return execSync('git rev-parse --git-path hooks', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      cwd,
    }).trim();
  } catch (_error) {
    return defaultPath;
  }
};

export const getGitHookPaths = (defaultPath = '.git/hooks', followGitConfig = true, cwd?: string) => {
  const gitHooksPath = followGitConfig ? getGitHooksPath(defaultPath, cwd) : defaultPath;
  return hookFileNames.map(fileName => join(gitHooksPath, fileName));
};
