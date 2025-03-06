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
  if (fileExists(path.join(repositoryRoot, 'yarn.lock'))) {
    // Read the first 128 bytes to determine yarn version
    const yarnLock = readFileSync(path.join(repositoryRoot, 'yarn.lock'), 'utf-8');
    return yarnLock.slice(0, 128).includes('yarn lockfile v1') ? 'yarn' : 'yarn-berry';
  }
  if (fileExists(path.join(repositoryRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
};

const getWorkspaceFlag = pm => {
  if (pm === 'pnpm') {
    return fileExists('pnpm-workspace.yaml') ? '-w' : undefined;
  }

  // Yarn v1 only, Yarn v2+ does not need a workspace flag
  if (pm === 'yarn') {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.workspaces && packageJson.workspaces.length > 0 ? '-W' : undefined;
  }
};

const main = () => {
  if (!fileExists('package.json')) {
    console.error('Please run this command from the root of a repository with a package.json.');
    return;
  }

  // Differentiate yarn v1 and v2+ but call them both with `yarn`
  const pm = getPackageManager();
  const bin = pm === 'yarn-berry' ? 'yarn' : pm;

  const cmd = [bin, 'add', getWorkspaceFlag(pm), '-D', 'knip', 'typescript', '@types/node'].filter(Boolean).join(' ');

  execSync(cmd, { stdio: 'inherit' });
  console.info('✓ Install Knip');

  execSync('npm pkg set scripts.knip=knip', { stdio: 'inherit' });
  console.info('✓ Add knip to package.json#scripts');

  console.info(`✓ Run "${bin} run knip" to run knip`);
};

main();
