import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { EOL } from 'node:os';
import { parseAndConvertGitignorePatterns as parse } from '../../src/util/glob-core.js';

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
