#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
// biome-ignore lint/nursery/noRestrictedImports: ignore
import path from 'node:path';

const fileExists = filePath => {
  const stat = statSync(filePath, { throwIfNoEntry: false });
  return stat?.isFile();
};

const getPackageManager = () => {
  // get the root of the repository
  const repositoryRoot = execSync('git rev-parse --show-toplevel').toString().trim();

  if (fileExists(path.join(repositoryRoot, 'bun.lockb'))) return 'bun';
  if (fileExists(path.join(repositoryRoot, 'yarn.lock'))) return 'yarn';
  if (fileExists(path.join(repositoryRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
};

const main = () => {
  if (!fileExists('package.json')) {
    console.error('Please run this command from the root of a repository with a package.json.');
    return;
  }

  const pm = getPackageManager();
  // check if pnpm workspace
  const isPnpmWorkspace = fileExists('pnpm-workspace.yaml');
  const cmd = [pm, 'add', isPnpmWorkspace ? '-w' : undefined, '-D', 'knip', 'typescript', '@types/node']
    .filter(Boolean)
    .join(' ');

  execSync(cmd);
  console.info('✓ Install Knip');

  execSync('npm pkg set scripts.knip=knip');
  console.info('✓ Add knip to package.json#scripts');

  console.info(`✓ Run "${pm} run knip" to run knip`);
};

main();
