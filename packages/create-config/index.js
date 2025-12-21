#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { EOL } from 'node:os';
import path from 'node:path';

const fileExists = filePath => {
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  return stat?.isFile();
};

const hasAccess = filePath => {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

const readFirstBytes = (filePath, length = 128) => {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(length);
  const bytesRead = fs.readSync(fd, buffer, 0, length, 0);
  fs.closeSync(fd);
  return buffer.subarray(0, bytesRead).toString('utf-8');
};

const getPackageManager = () => {
  // get the root of the repository
  let repositoryRoot = '';
  try {
    repositoryRoot = execSync('git rev-parse --show-toplevel', { stdio: [null, null, 'ignore'] })
      .toString()
      .trim();
  } catch {}

  if (fileExists(path.join(repositoryRoot, 'bun.lock'))) return 'bun';
  if (fileExists(path.join(repositoryRoot, 'bun.lockb'))) return 'bun';
  if (hasAccess(path.join(repositoryRoot, 'yarn.lock'))) {
    const yarnLock = readFirstBytes(path.join(repositoryRoot, 'yarn.lock'), 128);
    return yarnLock.includes('yarn lockfile v1') ? 'yarn' : 'yarn-berry';
  }
  if (fileExists(path.join(repositoryRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
};

const getBinX = pm => {
  if (pm === 'npm') return 'npx';
  return pm;
};

const hasWorkspaces = (manifest) => {
  if (manifest.workspaces) {
    if (Array.isArray(manifest.workspaces) && manifest.workspaces.length > 0) return true;
    if (typeof manifest.workspaces === 'object' && manifest.workspaces.packages?.length > 0) return true;
  }

  if (hasAccess('pnpm-workspace.yaml')) {
    try {
      const content = fs.readFileSync('pnpm-workspace.yaml', 'utf-8');
      return /(^|\n)packages:\n/.test(content);
    } catch {
      return false;
    }
  }

  return false;
};

const getWorkspaceFlag = (manifest, pm) => {
  if (pm === 'pnpm' || pm === 'yarn') return hasWorkspaces(manifest) ? '-w' : undefined;
};

const getPackageManagerFromPackageJson = (manifest) => {
  if (!manifest.packageManager) return undefined;

  const pmName = manifest.packageManager.split('@')[0];

  const validPackageManagers = ['bun', 'yarn', 'yarn-berry', 'pnpm', 'npm'];
  if (!validPackageManagers.includes(pmName)) return undefined;

  return pmName;
};

const main = () => {
  if (!fileExists('package.json')) {
    console.error('Please run this command from the root of a repository with a package.json.');
    return;
  }

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const manifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // Differentiate yarn v1 and v2+ but call them both with `yarn`
  const pm = getPackageManagerFromPackageJson(manifest) ?? getPackageManager();
  const bin = pm === 'yarn-berry' ? 'yarn' : pm;

  const cmd = [bin, 'add', getWorkspaceFlag(manifest, pm), '-D', 'knip', 'typescript', '@types/node'].filter(Boolean).join(' ');

  execSync(cmd, { stdio: 'inherit' });

  console.info('');
  console.info('✓ Install Knip');

  const knipConfig = {
    $schema: 'https://unpkg.com/knip@5/schema.json',
    ignoreExportsUsedInFile: {
      interface: true,
      type: true,
    },
    tags: ['-lintignore'],
  };

  if (hasWorkspaces(manifest)) knipConfig.workspaces = { '.': {} };

  try {
    if (!fileExists('knip.json')) {
      fs.writeFileSync('knip.json', `${JSON.stringify(knipConfig, null, 2)}${EOL}`);
      console.info('✓ Create knip.json');
    } else {
      console.info('✓ Detected knip.json');
    }
  } catch (error) {
    console.warn('× Failed to create knip.json:', error.message);
  }

  try {
    execSync('npm pkg set scripts.knip=knip 2>/dev/null');
    console.info('✓ Add knip to package.json#scripts');
    console.info('');
    console.info(`→ Run \`${bin} run knip --max-show-issues 5\` to run Knip for the first time`);
  } catch {
    console.warn('× Failed to add knip to package.json#scripts');
    console.info('');
    console.info(`→ Run \`${getBinX(bin)} knip --max-show-issues 5\` to run Knip for the first time`);
  }

  console.info(`→ Continue with https://knip.dev/overview/configuration`);
};

main();
