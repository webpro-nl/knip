import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { findAndParseGitignores } from '../../src/util/glob-core.js';
import { resolve } from '../../src/util/path.js';

test.skip('findAndParseGitignores', async () => {
  const cwd = resolve('fixtures/glob');

  const gitignore = await findAndParseGitignores(cwd);

  assert.deepEqual(gitignore, {
    gitignoreFiles: ['.gitignore', 'a/.gitignore', 'a/b/.gitignore'],
    ignores: ['.git', '**/node_modules/**', '.yarn', '.git', '**/node_modules/**', '.yarn', '**/a/b/c', '**/a/b/c/**'],
    unignores: [],
  });
});

test('findAndParseGitignores', async () => {
  const cwd = resolve('fixtures/glob/a');

  const gitignore = await findAndParseGitignores(cwd);

  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../.gitignore', '../../../.gitignore', '../../../../../.gitignore', '.gitignore', 'b/.gitignore'],
    ignores: [
      '.git',
      '**/node_modules/**',
      '.yarn',
      '**/b/c',
      '**/b/c/**',
      '**/.idea',
      '**/.idea/**',
      '.git',
      '**/node_modules/**',
      '.yarn',
    ],
    unignores: [],
  });
});

test('findAndParseGitignores', async () => {
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
    ignores: [
      '.git',
      '**/node_modules/**',
      '.yarn',
      '**/c',
      '**/c/**',
      '**/.idea',
      '**/.idea/**',
      '.git',
      '**/node_modules/**',
      '.yarn',
    ],
    unignores: [],
  });
});
