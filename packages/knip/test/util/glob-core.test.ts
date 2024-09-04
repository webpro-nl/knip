import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { convertGitignoreToPicomatchIgnorePatterns as convert } from '../../src/util/glob-core.js';

test('convertGitignoreToPicomatch', () => {
  assert.deepEqual(convert('*.ext'), {
    negated: false,
    root: false,
    patterns: ['**/*.ext', '**/*.ext/**'],
  });

  assert.deepEqual(convert('!*.ext'), {
    negated: true,
    root: false,
    patterns: ['**/*.ext', '**/*.ext/**'],
  });

  assert.deepEqual(convert('dir'), {
    negated: false,
    root: false,
    patterns: ['**/dir', '**/dir/**'],
  });

  assert.deepEqual(convert('dir/'), {
    negated: false,
    root: false,
    patterns: ['**/dir', '**/dir/**'],
  });

  assert.deepEqual(convert('.dot'), {
    negated: false,
    root: false,
    patterns: ['**/.dot', '**/.dot/**'],
  });

  assert.deepEqual(convert('*.stars*'), {
    negated: false,
    root: false,
    patterns: ['**/*.stars*', '**/*.stars*/**'],
  });

  assert.deepEqual(convert('!.ext'), {
    negated: true,
    root: false,
    patterns: ['**/.ext', '**/.ext/**'],
  });

  assert.deepEqual(convert('file.ext'), {
    negated: false,
    root: false,
    patterns: ['**/file.ext', '**/file.ext/**'],
  });

  assert.deepEqual(convert('/root'), {
    negated: false,
    root: true,
    patterns: ['root', 'root/**'],
  });

  assert.deepEqual(convert('/**/.dot/*'), {
    negated: false,
    root: true,
    patterns: ['**/.dot/*', '**/.dot/*'],
  });

  assert.deepEqual(convert('!/**/.dot/dir'), {
    negated: true,
    root: true,
    patterns: ['**/.dot/dir', '**/.dot/dir/**'],
  });

  assert.deepEqual(convert('!/no-root'), {
    negated: true,
    root: true,
    patterns: ['no-root', 'no-root/**'],
  });

  assert.deepEqual(convert('so/deep/dir'), {
    negated: false,
    root: false,
    patterns: ['**/so/deep/dir', '**/so/deep/dir/**'],
  });

  assert.deepEqual(convert('/**/root-star'), {
    negated: false,
    root: true,
    patterns: ['**/root-star', '**/root-star/**'],
  });

  assert.deepEqual(convert('!**/deep/**/stars.ext'), {
    negated: true,
    root: false,
    patterns: ['**/deep/**/stars.ext', '**/deep/**/stars.ext/**'],
  });
});
