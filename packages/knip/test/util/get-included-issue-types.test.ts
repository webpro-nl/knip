import assert from 'node:assert/strict';
import test from 'node:test';
import { ISSUE_TYPES } from '../../src/constants.js';
import { defaultExcludedIssueTypes, getIncludedIssueTypes } from '../../src/util/get-included-issue-types.js';

const included = (type: string) => [type, true];
const excluded = (type: string) => [type, false];
const all = Object.fromEntries(ISSUE_TYPES.map(included));
const none = Object.fromEntries(ISSUE_TYPES.map(excluded));
const defaults = Object.fromEntries([
  ...ISSUE_TYPES.filter(type => !defaultExcludedIssueTypes.includes(type)).map(included),
  ...defaultExcludedIssueTypes.map(excluded),
]);
const base = {
  include: [],
  exclude: [],
};

test('Resolve included issue types (default)', async () => {
  const config = getIncludedIssueTypes(base);
  assert.deepEqual(config, { ...defaults });
});

test('Resolve included issue types (all)', async () => {
  const config = getIncludedIssueTypes({ ...base, includeOverrides: ['classMembers', 'nsExports', 'nsTypes'] });
  assert.deepEqual(config, { ...all });
});

test('Resolve included issue types (include single)', async () => {
  const config = getIncludedIssueTypes({ ...base, includeOverrides: ['duplicates'] });
  assert.deepEqual(config, { ...none, duplicates: true });
});

test('Resolve included issue types (exclude some)', async () => {
  const config = getIncludedIssueTypes({ ...base, excludeOverrides: ['duplicates', 'nsTypes'] });
  assert.deepEqual(config, { ...defaults, duplicates: false, nsTypes: false });
});

test('Resolve included issue types (overlap)', async () => {
  const config = getIncludedIssueTypes({
    ...base,
    includeOverrides: ['exports', 'files', 'nsTypes'],
    excludeOverrides: ['files', 'duplicates'],
  });
  assert.deepEqual(config, { ...none, exports: true, nsTypes: true });
});

test('Resolve included issue types (include devDependencies)', async () => {
  const config = getIncludedIssueTypes({ ...base, includeOverrides: ['dependencies'] });
  assert.deepEqual(config, { ...none, dependencies: true, devDependencies: true, optionalPeerDependencies: true });
});

test('Resolve included issue types (include dependencies)', async () => {
  const config = getIncludedIssueTypes({ ...base, includeOverrides: ['dependencies'], isProduction: true });
  assert.deepEqual(config, { ...none, dependencies: true });
});

test('Resolve included issue types (exclude dependencies)', async () => {
  const config = getIncludedIssueTypes({ ...base, excludeOverrides: ['dependencies'] });
  assert.deepEqual(config, {
    ...defaults,
    dependencies: false,
    devDependencies: false,
    optionalPeerDependencies: false,
  });
});

test('Resolve included issue types (--dependencies)', async () => {
  const config = getIncludedIssueTypes({
    ...base,
    includeOverrides: ['dependencies', 'optionalPeerDependencies', 'unlisted', 'binaries', 'unresolved'],
  });
  assert.deepEqual(config, {
    ...none,
    dependencies: true,
    devDependencies: true,
    optionalPeerDependencies: true,
    unlisted: true,
    binaries: true,
    unresolved: true,
  });
});

test('Resolve included issue types (--exports)', async () => {
  const config = getIncludedIssueTypes({
    ...base,
    includeOverrides: ['exports', 'types', 'enumMembers', 'duplicates'],
  });
  assert.deepEqual(config, { ...none, exports: true, types: true, enumMembers: true, duplicates: true });
});

test('Resolve included issue types (--files)', async () => {
  const config = getIncludedIssueTypes({ ...base, includeOverrides: ['files'] });
  assert.deepEqual(config, { ...none, files: true });
});

test('Resolve included issue types (all)', async () => {
  const config = getIncludedIssueTypes({
    ...base,
    includeOverrides: [
      'classMembers',
      'nsExports',
      'nsTypes',
      'dependencies',
      'optionalPeerDependencies',
      'unlisted',
      'binaries',
      'unresolved',
      'exports',
      'types',
      'enumMembers',
      'duplicates',
      'files',
    ],
  });
  assert.deepEqual(config, all);
});
