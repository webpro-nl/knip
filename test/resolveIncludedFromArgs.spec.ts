import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIncludedIssueTypes } from '../src/util/config';

test('resolveIncludedIssueTypes (all)', async () => {
  const config = resolveIncludedIssueTypes([], []);
  assert.deepEqual(config, {
    dependencies: true,
    duplicates: true,
    exports: true,
    files: true,
    nsExports: true,
    nsTypes: true,
    types: true,
    unlisted: true,
  });
});

test('resolveIncludedIssueTypes (include 1)', async () => {
  const config = resolveIncludedIssueTypes(['duplicates'], []);
  assert.deepEqual(config, {
    dependencies: false,
    duplicates: true,
    exports: false,
    files: false,
    nsExports: false,
    nsTypes: false,
    types: false,
    unlisted: false,
  });
});

test('resolveIncludedIssueTypes (exclude 2)', async () => {
  const config = resolveIncludedIssueTypes([], ['duplicates', 'nsTypes']);
  assert.deepEqual(config, {
    dependencies: true,
    duplicates: false,
    exports: true,
    files: true,
    nsExports: true,
    nsTypes: false,
    types: true,
    unlisted: true,
  });
});

test('resolveIncludedIssueTypes (overlap)', async () => {
  const config = resolveIncludedIssueTypes(['exports', 'files', 'nsTypes'], ['files', 'duplicates']);
  assert.deepEqual(config, {
    dependencies: false,
    duplicates: false,
    exports: true,
    files: false,
    nsExports: false,
    nsTypes: true,
    types: false,
    unlisted: false,
  });
});
