import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIncludedIssueGroups } from '../src/util/config';

test('resolveIncludedIssueGroups (all)', async () => {
  const config = resolveIncludedIssueGroups([], []);
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

test('resolveIncludedIssueGroups (include 1)', async () => {
  const config = resolveIncludedIssueGroups(['duplicates'], []);
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

test('resolveIncludedIssueGroups (exclude 2)', async () => {
  const config = resolveIncludedIssueGroups([], ['duplicates', 'nsTypes']);
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

test('resolveIncludedIssueGroups (overlap)', async () => {
  const config = resolveIncludedIssueGroups(['exports', 'files', 'nsTypes'], ['files', 'duplicates']);
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
