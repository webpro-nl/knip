import assert from 'node:assert/strict';
import test from 'node:test';
import { findMatch, toRegexOrString } from '../../src/util/regex.ts';

test('toRegexOrString', () => {
  assert.equal(toRegexOrString('zip'), 'zip');
  assert.deepEqual(toRegexOrString('pm2-.+'), /pm2-.+/);
  assert.equal(toRegexOrString('g++'), 'g++');
  assert.equal(toRegexOrString('c++filt'), 'c++filt');
});

test('findMatch with literal fallback for invalid regex', () => {
  const haystack = ['g++', 'pm2-.+'].map(toRegexOrString);
  assert.equal(findMatch(haystack, 'g++'), 'g++');
  assert.ok(findMatch(haystack, 'pm2-dev'));
  assert.equal(findMatch(haystack, 'gcc'), undefined);
});
