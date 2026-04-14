import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { findAndParseGitignores } from '../../src/util/glob-core.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

test('findAndParseGitignores', async () => {
  const cwd = resolve('fixtures/glob');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../../.gitignore', '../../../../.gitignore', '.gitignore', 'a/.gitignore', 'a/b/.gitignore'],
    ignores: new Set([
      '**/.DS_Store',
      '**/.cache',
      '.git/!(hooks)',
      '**/node_modules',
      '**/packages/*/dist',
      '**/a/b/c',
      '**/.npmrc',
      '**/bin/knip',
      '**/bin/knip-bun',
    ]),
    unignores: new Set(),
  });
});

test('findAndParseGitignores (/a)', async () => {
  const cwd = resolve('fixtures/glob/a');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../.gitignore', '../../../.gitignore', '../../../../../.gitignore', '.gitignore', 'b/.gitignore'],
    ignores: new Set([
      '.git/!(hooks)',
      '**/node_modules',
      '**/packages/*/dist',
      '**/b/c',
      '**/.DS_Store',
      '**/.cache',
      '**/.npmrc',
      '**/bin/knip',
      '**/bin/knip-bun',
    ]),
    unignores: new Set(),
  });
});

test('findAndParseGitignores (/a/b', async () => {
  const cwd = resolve('fixtures/glob/a/b');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: [
      '../.gitignore',
      '../../.gitignore',
      '../../../../.gitignore',
      '../../../../../../.gitignore',
      '.gitignore',
    ],
    ignores: new Set([
      '.git/!(hooks)',
      '**/node_modules',
      '**/packages/*/dist',
      '**/c',
      '**/.DS_Store',
      '**/.cache',
      '**/.npmrc',
      '**/bin/knip',
      '**/bin/knip-bun',
    ]),
    unignores: new Set(),
  });
});

const worktreeRoot = resolve('fixtures/glob-worktree/root');
await fs.copyFile(join(worktreeRoot, 'dot-git'), join(worktreeRoot, '.git')).catch(() => {});

test('findAndParseGitignores (with .git file)', async () => {
  const cwd = resolve('fixtures/glob-worktree/root');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../mock-git-dir/info/exclude', '.gitignore', 'subdir/.gitignore'],
    ignores: new Set([
      '.git/!(hooks)',
      '**/node_modules',
      '**/worktree-exclude-ignored',
      '**/worktree-ignored',
      'subdir/**/subdir-ignored',
    ]),
    unignores: new Set(),
  });
});

test('findAndParseGitignores (with .git file in ancestor)', async () => {
  const cwd = resolve('fixtures/glob-worktree/root/subdir');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../.gitignore', '.gitignore'],
    ignores: new Set(['.git/!(hooks)', '**/node_modules', '**/worktree-ignored', '**/subdir-ignored']),
    unignores: new Set(),
  });
});
