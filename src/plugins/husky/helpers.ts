import { execSync } from 'child_process';

export const getGitHooksPath = () => {
  try {
    return execSync('git config --get core.hooksPath', { encoding: 'utf8' }).trim();
  } catch (error) {
    return '.husky';
  }
};
