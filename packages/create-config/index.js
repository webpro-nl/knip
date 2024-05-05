#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const fileExists = filePath => {
  const stat = statSync(filePath, { throwIfNoEntry: false });
  return stat?.isFile();
};

const getPackageManager = () => {
  if (fileExists('bun.lockb')) return 'bun';
  if (fileExists('yarn.lock')) return 'yarn';
  if (fileExists('pnpm-lock.yaml')) return 'pnpm';
  return 'npm';
};

const main = () => {
  if (!fileExists('package.json')) {
    console.error('Please run this command from the root of a repository with a package.json.');
    return;
  }

  const pm = getPackageManager();
  const cmd = [pm, 'add', '-D', 'knip', 'typescript', '@types/node'].join(' ');

  execSync(cmd);
  console.info('✓ Install Knip');

  execSync('npm pkg set scripts.knip=knip');
  console.info('✓ Add knip to package.json#scripts');

  console.info(`✓ Run "${pm} run knip" to run knip`);
};

main();
