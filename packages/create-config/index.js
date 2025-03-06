#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
// biome-ignore lint/nursery/noRestrictedImports: ignore
import path from 'node:path';

const fileExists = filePath => {
  const stat = statSync(filePath, { throwIfNoEntry: false });
  return stat?.isFile();
};

const getPackageManager = () => {
  // get the root of the repository
  let repositoryRoot = '';
  try {
    repositoryRoot = execSync('git rev-parse --show-toplevel', { stdio: [null, null, 'ignore'] })
      .toString()
      .trim();
  } catch {}

  if (fileExists(path.join(repositoryRoot, 'bun.lockb'))) return 'bun';
  if (fileExists(path.join(repositoryRoot, 'yarn.lock'))) return 'yarn';
  if (fileExists(path.join(repositoryRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
};

const getWorkspaceFlag = pm => {
  if (pm === 'pnpm') {
    return fileExists('pnpm-workspace.yaml') ? '-w' : undefined;
  }
};

const main = () => {
  if (!fileExists('package.json')) {
    console.error('Please run this command from the root of a repository with a package.json.');
    return;
  }

  const pm = getPackageManager();

  const cmd = [pm, 'add', getWorkspaceFlag(pm), '-D', 'knip', 'typescript', '@types/node'].filter(Boolean).join(' ');

  execSync(cmd, { stdio: "inherit" });
  console.info('✓ Install Knip');

  execSync('npm pkg set scripts.knip=knip', { stdio: "inherit" });
  console.info('✓ Add knip to package.json#scripts');

  console.info(`✓ Run "${pm} run knip" to run knip`);
};

main();
