import { test } from 'bun:test';
import assert from 'node:assert/strict';
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
const shorthands = { isDependenciesShorthand: false, isExportsShorthand: false, isFilesShorthand: false };

test('Resolve included issue types (default)', async () => {
  const cliArgs = { includedIssueTypes: [], excludedIssueTypes: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...defaults });
});

test('Resolve included issue types (all)', async () => {
  const cliArgs = {
    includedIssueTypes: ['classMembers', 'nsExports', 'nsTypes'],
    excludedIssueTypes: [],
    ...shorthands,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...all });
});

test('Resolve included issue types (include single)', async () => {
  const cliArgs = { includedIssueTypes: ['duplicates'], excludedIssueTypes: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, duplicates: true });
});

test('Resolve included issue types (exclude some)', async () => {
  const cliArgs = {
    includedIssueTypes: [],
    excludedIssueTypes: ['duplicates', 'nsTypes'],
    isDependenciesShorthand: false,
    isExportsShorthand: false,
    isFilesShorthand: false,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...defaults, duplicates: false, nsTypes: false });
});

test('Resolve included issue types (overlap)', async () => {
  const cliArgs = {
    includedIssueTypes: ['exports', 'files', 'nsTypes'],
    excludedIssueTypes: ['files', 'duplicates'],
    ...shorthands,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, exports: true, nsTypes: true });
});

test('Resolve included issue types (include devDependencies)', async () => {
  const cliArgs = { includedIssueTypes: ['dependencies'], excludedIssueTypes: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, dependencies: true, devDependencies: true, optionalPeerDependencies: true });
});

test('Resolve included issue types (include dependencies)', async () => {
  const cliArgs = { includedIssueTypes: ['dependencies'], excludedIssueTypes: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs, { isProduction: true });
  assert.deepEqual(config, { ...none, dependencies: true });
});

test('Resolve included issue types (exclude dependencies)', async () => {
  const cliArgs = { includedIssueTypes: [], excludedIssueTypes: ['dependencies'], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, {
    ...defaults,
    dependencies: false,
    devDependencies: false,
    optionalPeerDependencies: false,
  });
});

test('Resolve included issue types (--dependencies)', async () => {
  const cliArgs = {
    includedIssueTypes: [],
    excludedIssueTypes: [],
    isDependenciesShorthand: true,
    isExportsShorthand: false,
    isFilesShorthand: false,
  };
  const config = getIncludedIssueTypes(cliArgs);
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
  const cliArgs = {
    includedIssueTypes: [],
    excludedIssueTypes: [],
    isDependenciesShorthand: false,
    isExportsShorthand: true,
    isFilesShorthand: false,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, exports: true, types: true, enumMembers: true, duplicates: true });
});

test('Resolve included issue types (--files)', async () => {
  const cliArgs = {
    includedIssueTypes: [],
    excludedIssueTypes: [],
    isDependenciesShorthand: false,
    isExportsShorthand: false,
    isFilesShorthand: true,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, files: true });
});

test('Resolve included issue types (all)', async () => {
  const cliArgs = {
    includedIssueTypes: ['classMembers', 'nsExports', 'nsTypes'],
    excludedIssueTypes: [],
    isDependenciesShorthand: true,
    isExportsShorthand: true,
    isFilesShorthand: true,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, all);
});
