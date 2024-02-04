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

test('Resolve included issue types (default)', async () => {
  const cliArgs = { include: [], exclude: [], dependencies: false, exports: false };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...defaults });
});

test('Resolve included issue types (all)', async () => {
  const cliArgs = { include: ['classMembers', 'nsExport', 'nsType'], exclude: [], dependencies: false, exports: false };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...all });
});

test('Resolve included issue types (include single)', async () => {
  const cliArgs = { include: ['duplicates'], exclude: [], dependencies: false, exports: false };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, duplicates: true });
});

test('Resolve included issue types (exclude some)', async () => {
  const cliArgs = { include: [], exclude: ['duplicates', 'nsTypes'], dependencies: false, exports: false };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...defaults, duplicates: false, nsTypes: false });
});

test('Resolve included issue types (overlap)', async () => {
  const cliArgs = {
    include: ['exports', 'files', 'nsTypes'],
    exclude: ['files', 'duplicates'],
    dependencies: false,
    exports: false,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, exports: true, nsTypes: true });
});

test('Resolve included issue types (include devDependencies)', async () => {
  const cliArgs = { include: ['dependencies'], exclude: [], dependencies: false, exports: false };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, { ...none, dependencies: true, devDependencies: true, optionalPeerDependencies: true });
});

test('Resolve included issue types (include dependencies)', async () => {
  const cliArgs = { include: ['dependencies'], exclude: [], dependencies: false, exports: false };
  const config = getIncludedIssueTypes(cliArgs, { isProduction: true });
  assert.deepEqual(config, { ...none, dependencies: true });
});

test('Resolve included issue types (exclude dependencies)', async () => {
  const cliArgs = { include: [], exclude: ['dependencies'], dependencies: false, exports: false };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, {
    ...defaults,
    dependencies: false,
    devDependencies: false,
    optionalPeerDependencies: false,
  });
});

test('Resolve included issue types (--dependencies)', async () => {
  const cliArgs = { include: [], exclude: [], dependencies: true, exports: false };
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
  const cliArgs = { include: [], exclude: [], dependencies: false, exports: true };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, {
    ...none,
    exports: true,
    nsExports: true,
    classMembers: true,
    types: true,
    nsTypes: true,
    enumMembers: true,
    duplicates: true,
  });
});

test('Resolve included issue types (all)', async () => {
  const cliArgs = {
    include: ['files', 'classMembers', 'nsExport', 'nsType'],
    exclude: [],
    dependencies: true,
    exports: true,
  };
  const config = getIncludedIssueTypes(cliArgs);
  assert.deepEqual(config, all);
});
