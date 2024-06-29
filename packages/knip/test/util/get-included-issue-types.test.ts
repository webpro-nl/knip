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
const shorthands = { dependencies: false, exports: false, files: false };

test('Resolve included issue types (default)', async () => {
  const cliArgs = { include: [], exclude: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...defaults });
});

test('Resolve included issue types (all)', async () => {
  const cliArgs = { include: ['classMembers', 'nsExports', 'nsTypes'], exclude: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...all });
});

test('Resolve included issue types (include single)', async () => {
  const cliArgs = { include: ['duplicates'], exclude: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, duplicates: true });
});

test('Resolve included issue types (exclude some)', async () => {
  const cliArgs = {
    include: [],
    exclude: ['duplicates', 'nsTypes'],
    dependencies: false,
    exports: false,
    files: false,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...defaults, duplicates: false, nsTypes: false });
});

test('Resolve included issue types (overlap)', async () => {
  const cliArgs = { include: ['exports', 'files', 'nsTypes'], exclude: ['files', 'duplicates'], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, exports: true, nsTypes: true });
});

test('Resolve included issue types (include devDependencies)', async () => {
  const cliArgs = { include: ['dependencies'], exclude: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, dependencies: true, devDependencies: true, optionalPeerDependencies: true });
});

test('Resolve included issue types (include dependencies)', async () => {
  const cliArgs = { include: ['dependencies'], exclude: [], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs, { isProduction: true });
  assert.deepEqual(config, { ...none, dependencies: true });
});

test('Resolve included issue types (exclude dependencies)', async () => {
  const cliArgs = { include: [], exclude: ['dependencies'], ...shorthands };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, {
    ...defaults,
    dependencies: false,
    devDependencies: false,
    optionalPeerDependencies: false,
  });
});

test('Resolve included issue types (--dependencies)', async () => {
  const cliArgs = { include: [], exclude: [], dependencies: true, exports: false, files: false };
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
  const cliArgs = { include: [], exclude: [], dependencies: false, exports: true, files: false };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, {
    ...none,
    exports: true,
    types: true,
    enumMembers: true,
    duplicates: true,
  });
});

test('Resolve included issue types (--files)', async () => {
  const cliArgs = { include: [], exclude: [], dependencies: false, exports: false, files: true };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, files: true });
});

test('Resolve included issue types (all)', async () => {
  const cliArgs = {
    include: ['classMembers', 'nsExports', 'nsTypes'],
    exclude: [],
    dependencies: true,
    exports: true,
    files: true,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, all);
});
