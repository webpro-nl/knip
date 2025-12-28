import assert from 'node:assert/strict';
import test from 'node:test';
import { findAndParseGitignores } from '../../src/util/glob-core.js';
import { resolve } from '../helpers/resolve.js';

test('findAndParseGitignores', async () => {
  const cwd = resolve('fixtures/glob');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../../.gitignore', '../../../../.gitignore', '.gitignore', 'a/.gitignore', 'a/b/.gitignore'],
    ignores: new Set([
      '**/.cache',
      '**/.cache/**',
      '.git',
      '**/node_modules',
      '**/node_modules/**',
      '**/packages/*/dist',
      '**/packages/*/dist/**',
      '.yarn',
      '**/a/b/c',
      '**/a/b/c/**',
      '**/.npmrc',
      '**/.npmrc/**',
    ]),
    unignores: [],
  });
});

test('findAndParseGitignores (/a)', async () => {
  const cwd = resolve('fixtures/glob/a');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../.gitignore', '../../../.gitignore', '../../../../../.gitignore', '.gitignore', 'b/.gitignore'],
    ignores: new Set([
      '.git',
      '**/node_modules',
      '**/node_modules/**',
      '**/packages/*/dist',
      '**/packages/*/dist/**',
      '.yarn',
      '**/b/c',
      '**/b/c/**',
      '**/.cache',
      '**/.cache/**',
      '**/.npmrc',
      '**/.npmrc/**',
    ]),
    unignores: [],
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
      '.git',
      '**/node_modules',
      '**/node_modules/**',
      '**/packages/*/dist',
      '**/packages/*/dist/**',
      '.yarn',
      '**/c',
      '**/c/**',
      '**/.cache',
      '**/.cache/**',
      '**/.npmrc',
      '**/.npmrc/**',
    ]),
    unignores: [],
  });
});

test('findAndParseGitignores (git worktree with .git file)', async () => {
  const cwd = resolve('fixtures/glob-worktree/root');
  const gitignore = await findAndParseGitignores(cwd);
  // With a .git file (worktree), should NOT traverse to ancestor directories
  // (contrast with other tests that include ancestor gitignore files like '../../.gitignore')
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['.gitignore', 'subdir/.gitignore'],
    ignores: new Set([
      '.git',
      '**/node_modules/**',
      '.yarn',
      '**/worktree-ignored',
      '**/worktree-ignored/**',
      'subdir/**/subdir-ignored',
      'subdir/**/subdir-ignored/**',
    ]),
    unignores: [],
  });
});

test('findAndParseGitignores (git worktree with .git file in ancestor)', async () => {
  const cwd = resolve('fixtures/glob-worktree/root/subdir');
  const gitignore = await findAndParseGitignores(cwd);
  // Running from subdirectory within worktree - should stop at ancestor .git file
  // and NOT continue to real ancestor directories outside the worktree
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../.gitignore', '.gitignore'],
    ignores: new Set([
      '.git',
      '**/node_modules/**',
      '.yarn',
      '**/worktree-ignored',
      '**/worktree-ignored/**',
      '**/subdir-ignored',
      '**/subdir-ignored/**',
    ]),
    unignores: [],
  });
});
