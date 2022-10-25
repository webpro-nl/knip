import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIncludedIssueTypes } from '../src/util/config.js';

const issueTypes = [
  'dependencies',
  'devDependencies',
  'duplicates',
  'exports',
  'files',
  'nsExports',
  'nsTypes',
  'types',
  'unlisted',
];

const all = Object.fromEntries(issueTypes.map(type => [type, true]));
const none = Object.fromEntries(issueTypes.map(type => [type, false]));

const localConfig = { entryFiles: [], projectFiles: [] };

test('Resolve included issue types (default)', async () => {
  const config = resolveIncludedIssueTypes([], []);
  assert.deepEqual(config, { ...all, devDependencies: false });
});

test('Resolve included issue types (include single)', async () => {
  const config = resolveIncludedIssueTypes(['duplicates'], []);
  assert.deepEqual(config, { ...none, duplicates: true });
});

test('Resolve included issue types (exclude some)', async () => {
  const config = resolveIncludedIssueTypes([], ['duplicates', 'nsTypes']);
  assert.deepEqual(config, { ...all, devDependencies: false, duplicates: false, nsTypes: false });
});

test('Resolve included issue types (overlap)', async () => {
  const config = resolveIncludedIssueTypes(['exports', 'files', 'nsTypes'], ['files', 'duplicates']);
  assert.deepEqual(config, { ...none, exports: true, nsTypes: true });
});

test('Resolve included issue types (include devDependencies)', async () => {
  const config = resolveIncludedIssueTypes(['dependencies'], [], { ...localConfig, dev: true });
  assert.deepEqual(config, { ...none, dependencies: true, devDependencies: true });
});

test('Resolve included issue types (include dependencies)', async () => {
  const config = resolveIncludedIssueTypes(['dependencies'], [], { ...localConfig, dev: false });
  assert.deepEqual(config, { ...none, dependencies: true });
});

test('Resolve included issue types (default/config)', async () => {
  const config = resolveIncludedIssueTypes([], [], { ...localConfig, dev: false });
  assert.deepEqual(config, { ...all, devDependencies: false });
});

test('Resolve included issue types (exclude dependencies)', async () => {
  const config = resolveIncludedIssueTypes([], ['dependencies'], { ...localConfig });
  assert.deepEqual(config, { ...all, dependencies: false, devDependencies: false });
});
