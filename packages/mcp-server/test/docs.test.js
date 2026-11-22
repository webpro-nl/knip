import assert from 'node:assert/strict';
import test from 'node:test';
import { ISSUE_TYPES } from 'knip/session';
import { CURATED_RESOURCES, ISSUE_TYPE_DOCS } from '../src/curated-resources.js';
import { ERROR_HINT, WORKFLOW } from '../src/texts.js';
import { getDocs } from '../src/tools.js';

/** Topic ids named in a text, e.g. "consult: handling-issues and jsdoc-tsdoc-tags" */
const getTopicRefs = text => {
  const refs = [];
  for (const m of text.matchAll(/^\s+- ([a-z-]+) \(/gm)) refs.push(m[1]);
  for (const m of text.matchAll(/consult: ([a-z-]+(?:#[a-z-]+)?(?:(?:,| and) [a-z-]+(?:#[a-z-]+)?)*)/g)) {
    refs.push(...m[1].split(/, | and /));
  }
  for (const m of text.matchAll(/e\.g\. ([a-z-]+#[a-z-]+)/g)) refs.push(m[1]);
  for (const m of text.matchAll(/topic "([a-z-]+)"(?: and "([a-z-]+)")?/g)) refs.push(...m.slice(1).filter(Boolean));
  return refs;
};

test('every curated resource resolves', () => {
  for (const [id, doc] of Object.entries(CURATED_RESOURCES)) assert.ok('content' in getDocs(id), `${id} (${doc.path})`);
});

test('every topic referenced in texts resolves', () => {
  const refs = getTopicRefs(WORKFLOW + ERROR_HINT);
  assert.ok(refs.length > 10);
  for (const ref of refs) assert.ok('content' in getDocs(ref), ref);
});

test('every issue type doc resolves to a section', () => {
  for (const [type, topic] of Object.entries(ISSUE_TYPE_DOCS)) {
    assert.ok(ISSUE_TYPES.includes(type), `unknown issue type: ${type}`);
    const result = getDocs(topic);
    assert.ok('content' in result, `${type}: ${topic}`);
    assert.match(result.content, /^#{2,6} /, `${type}: ${topic}`);
  }
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
