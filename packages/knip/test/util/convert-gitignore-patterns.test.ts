import assert from 'node:assert/strict';
import { EOL } from 'node:os';
import test from 'node:test';
import {
  convertGitignoreToPicomatchIgnorePatterns as convert,
  parseAndConvertGitignorePatterns as parse,
} from '../../src/util/parse-and-convert-gitignores.js';

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

test('parseAndConvertGitignorePatterns', async () => {
  const gitignorePatterns = ['.git', 'node_modules', 'a/b/c', '/a/b/c'];
  const globPatterns = parse(gitignorePatterns.join(EOL));
  assert.deepEqual(globPatterns, [
    { negated: false, patterns: ['**/.git', '**/.git/**'] },
    { negated: false, patterns: ['**/node_modules', '**/node_modules/**'] },
    { negated: false, patterns: ['**/a/b/c', '**/a/b/c/**'] },
    { negated: false, patterns: ['a/b/c', 'a/b/c/**'] },
  ]);
});

test('parseAndConvertGitignorePatterns (ancestor)', async () => {
  const gitignorePatterns = ['.git', 'node_modules', 'a/b/c', '/a/b/c'];
  const globPatterns = parse(gitignorePatterns.join(EOL), 'a/b/');
  assert.deepEqual(globPatterns, [
    { negated: false, patterns: ['**/.git', '**/.git/**'] },
    { negated: false, patterns: ['**/node_modules', '**/node_modules/**'] },
    { negated: false, patterns: ['**/c', '**/c/**'] }, // TODO FIXME: should probably be ['c', 'c/**']
    { negated: false, patterns: ['c', 'c/**'] },
  ]);
});

test('parseAndConvertGitignorePatterns (hashes)', async () => {
  const gitignorePatterns = ['#comment', 'ends-with-hash#', String.raw`\#starts-with-hash`];
  const globPatterns = parse(gitignorePatterns.join(EOL));
  assert.deepEqual(globPatterns, [
    { negated: false, patterns: ['**/ends-with-hash#', '**/ends-with-hash#/**'] },
    { negated: false, patterns: ['**/#starts-with-hash', '**/#starts-with-hash/**'] },
  ]);
});
