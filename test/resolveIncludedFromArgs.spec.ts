import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIncludedFromArgs } from '../src/util/config';

test('resolveIncludedFromArgs (all)', async () => {
  const config = resolveIncludedFromArgs([], []);
  assert.deepEqual(config, {
    duplicates: true,
    exports: true,
    files: true,
    nsExports: true,
    nsTypes: true,
    types: true,
  });
});

test('resolveIncludedFromArgs (only 1)', async () => {
  const config = resolveIncludedFromArgs(['duplicates'], []);
  assert.deepEqual(config, {
    duplicates: true,
    exports: false,
    files: false,
    nsExports: false,
    nsTypes: false,
    types: false,
  });
});

test('resolveIncludedFromArgs (exclude 2)', async () => {
  const config = resolveIncludedFromArgs([], ['duplicates', 'nsTypes']);
  assert.deepEqual(config, {
    duplicates: false,
    exports: true,
    files: true,
    nsExports: true,
    nsTypes: false,
    types: true,
  });
});

test('resolveIncludedFromArgs (overlap)', async () => {
  const config = resolveIncludedFromArgs(['exports', 'files', 'nsTypes'], ['files', 'duplicates']);
  assert.deepEqual(config, {
    duplicates: false,
    exports: true,
    files: false,
    nsExports: false,
    nsTypes: true,
    types: false,
  });
});
