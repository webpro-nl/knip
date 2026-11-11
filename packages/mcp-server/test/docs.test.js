import assert from 'node:assert/strict';
import test from 'node:test';
import { CURATED_RESOURCES } from '../src/curated-resources.js';
import { getDocs } from '../src/tools.js';

test('every curated resource resolves', () => {
  for (const [id, doc] of Object.entries(CURATED_RESOURCES)) assert.ok('content' in getDocs(id), `${id} (${doc.path})`);
});

test('getDocs returns a section by anchor', () => {
  const result = getDocs('handling-issues#unused-dependencies');
  assert.ok('content' in result);
  assert.match(result.content, /^## Unused dependencies\n/);
  assert.match(result.content, /### Unlisted binaries/);
  assert.doesNotMatch(result.content, /## Feedback or false positives\?/);

  const option = getDocs('configuration-reference#ignorebinaries');
  assert.ok('content' in option);
  assert.match(option.content, /^### `ignoreBinaries`\n/);

  assert.ok('content' in getDocs('reference/configuration#ignorebinaries'));
});

test('getDocs resolves site paths as in doc links', () => {
  assert.deepEqual(getDocs('/reference/cli'), getDocs('reference/cli'));
});

test('getDocs lists available sections for an unknown anchor', () => {
  const result = getDocs('handling-issues#nope');
  assert.ok('error' in result);
  assert.match(result.error, /#unused-files/);
});

test('getDocs ignores inherited keys', () => {
  assert.ok('error' in getDocs('constructor'));
  assert.ok('error' in getDocs('/toString'));
  assert.ok('error' in getDocs('handling-issues#constructor'));
});
