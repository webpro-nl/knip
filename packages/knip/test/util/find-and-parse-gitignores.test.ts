import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { findAndParseGitignores } from '../../src/util/glob-core.js';
import { resolve } from '../../src/util/path.js';

test('findAndParseGitignores', async () => {
  const cwd = resolve('fixtures/glob');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../../.gitignore', '../../../../.gitignore', '.gitignore', 'a/.gitignore', 'a/b/.gitignore'],
    ignores: new Set([
      '**/.cache',
      '**/.cache/**',
      '**/.idea',
      '**/.idea/**',
      '.git',
      '**/node_modules',
      '**/node_modules/**',
      '.yarn',
      '**/a/b/c',
      '**/a/b/c/**',
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
      '.yarn',
      '**/b/c',
      '**/b/c/**',
      '**/.cache',
      '**/.cache/**',
      '**/.idea',
      '**/.idea/**',
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
      '.yarn',
      '**/c',
      '**/c/**',
      '**/.cache',
      '**/.cache/**',
      '**/.idea',
      '**/.idea/**',
    ]),
    unignores: [],
  });
});
