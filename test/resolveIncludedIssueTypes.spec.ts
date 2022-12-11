import assert from 'node:assert/strict';
import test from 'node:test';
import { ISSUE_TYPES } from '../src/constants.js';
import { resolveIncludedIssueTypes } from '../src/util/resolveIncludedIssueTypes.js';

const all = Object.fromEntries(ISSUE_TYPES.map(type => [type, true]));
const none = Object.fromEntries(ISSUE_TYPES.map(type => [type, false]));

test('Resolve included issue types (default)', async () => {
  const config = resolveIncludedIssueTypes([], []);
  assert.deepEqual(config, { ...all });
});

test('Resolve included issue types (include single)', async () => {
  const config = resolveIncludedIssueTypes(['duplicates'], []);
  assert.deepEqual(config, { ...none, duplicates: true });
});

test('Resolve included issue types (exclude some)', async () => {
  const config = resolveIncludedIssueTypes([], ['duplicates', 'nsTypes']);
  assert.deepEqual(config, { ...all, duplicates: false, nsTypes: false });
});

test('Resolve included issue types (overlap)', { only: true }, async () => {
  const config = resolveIncludedIssueTypes(['exports', 'files', 'nsTypes'], ['files', 'duplicates']);
  assert.deepEqual(config, { ...none, exports: true, nsTypes: true });
});

test('Resolve included issue types (include devDependencies)', async () => {
  const config = resolveIncludedIssueTypes(['dependencies'], []);
  assert.deepEqual(config, { ...none, dependencies: true, devDependencies: true });
});

test('Resolve included issue types (include dependencies)', async () => {
  const config = resolveIncludedIssueTypes(['dependencies'], [], { isProduction: true });
  assert.deepEqual(config, { ...none, dependencies: true });
});

test('Resolve included issue types (exclude dependencies)', async () => {
  const config = resolveIncludedIssueTypes([], ['dependencies']);
  assert.deepEqual(config, { ...all, dependencies: false, devDependencies: false });
});
