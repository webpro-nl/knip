import { execSync } from 'node:child_process';
import { join } from './path.js';

// TODO More hooks exists, but is it worth adding all of them?
// https://git-scm.com/docs/githooks
// https://github.com/fisker/git-hooks-list/blob/main/index.json

const hookFileNames = [
  'prepare-commit-msg',
  'commit-msg',
  'pre-{applypatch,commit,merge-commit,push,rebase,receive}',
  'post-{checkout,commit,merge,rewrite}',
];

const getGitHooksPath = (defaultPath = '.git/hooks') => {
  try {
    return execSync('git config --get core.hooksPath', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (_error) {
    return defaultPath;
  }
};

export const getGitHookPaths = (defaultPath = '.git/hooks', followGitConfig = true) => {
  const gitHooksPath = followGitConfig ? getGitHooksPath(defaultPath) : defaultPath;
  return hookFileNames.map(fileName => join(gitHooksPath, fileName));
};
