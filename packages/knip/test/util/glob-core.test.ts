import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { convertGitignoreToPicomatchIgnorePatterns as convert } from '../../src/util/glob-core.js';

test('convertGitignoreToPicomatch', () => {
  assert.deepEqual(convert('*.ext'), { negated: false, patterns: ['**/*.ext', '**/*.ext/**'] });
  assert.deepEqual(convert('!*.ext'), { negated: true, patterns: ['**/*.ext', '**/*.ext/**'] });
  assert.deepEqual(convert('dir'), { negated: false, patterns: ['**/dir', '**/dir/**'] });
  assert.deepEqual(convert('dir/'), { negated: false, patterns: ['**/dir', '**/dir/**'] });
  assert.deepEqual(convert('.dot'), { negated: false, patterns: ['**/.dot', '**/.dot/**'] });
  assert.deepEqual(convert('*.stars*'), { negated: false, patterns: ['**/*.stars*', '**/*.stars*/**'] });
  assert.deepEqual(convert('!.ext'), { negated: true, patterns: ['**/.ext', '**/.ext/**'] });
  assert.deepEqual(convert('file.ext'), { negated: false, patterns: ['**/file.ext', '**/file.ext/**'] });
  assert.deepEqual(convert('/root'), { negated: false, patterns: ['root', 'root/**'] });
  assert.deepEqual(convert('/**/.dot/*'), { negated: false, patterns: ['**/.dot/*', '**/.dot/*'] });
  assert.deepEqual(convert('!/**/.dot/dir'), { negated: true, patterns: ['**/.dot/dir', '**/.dot/dir/**'] });
  assert.deepEqual(convert('!/no-root'), { negated: true, patterns: ['no-root', 'no-root/**'] });
  assert.deepEqual(convert('so/deep/dir'), { negated: false, patterns: ['**/so/deep/dir', '**/so/deep/dir/**'] });
  assert.deepEqual(convert('/**/root-star'), { negated: false, patterns: ['**/root-star', '**/root-star/**'] });
  assert.deepEqual(convert('!**/dir/**/f.ext'), { negated: true, patterns: ['**/dir/**/f.ext', '**/dir/**/f.ext/**'] });
});
