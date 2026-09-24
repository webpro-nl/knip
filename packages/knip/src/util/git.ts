import { execFileSync, execSync } from 'node:child_process';
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

const remoteUrlCache = new Map<string, string[]>();

export const getGitRemoteUrls = (cwd: string) => {
  const cached = remoteUrlCache.get(cwd);
  if (cached) return cached;

  const urls: string[] = [];
  try {
    const output = execFileSync('git', ['config', '--local', '--get-regexp', String.raw`^remote\..*\.url$`], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      cwd,
    });
    for (const line of output.trim().split('\n')) {
      const separator = line.indexOf(' ');
      if (separator !== -1) urls.push(line.slice(separator + 1));
    }
  } catch (_error) {}

  remoteUrlCache.set(cwd, urls);
  return urls;
};

export const getGitHookPaths = (defaultPath = '.git/hooks', followGitConfig = true, cwd?: string) => {
  const gitHooksPath = followGitConfig ? getGitHooksPath(defaultPath, cwd) : defaultPath;
  return hookFileNames.map(fileName => join(gitHooksPath, fileName));
};
