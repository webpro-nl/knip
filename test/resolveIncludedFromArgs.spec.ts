import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIncludedFromArgs } from '../src/util/config';

test('resolveIncludedFromArgs (all)', async () => {
  const config = resolveIncludedFromArgs([], []);
  assert.deepEqual(config, { duplicates: true, exports: true, files: true, members: true, types: true });
});

test('resolveIncludedFromArgs (only 1)', async () => {
  const config = resolveIncludedFromArgs(['duplicates'], []);
  assert.deepEqual(config, { duplicates: true, exports: false, files: false, members: false, types: false });
});

test('resolveIncludedFromArgs (exclude 2)', async () => {
  const config = resolveIncludedFromArgs([], ['duplicates', 'members']);
  assert.deepEqual(config, { duplicates: false, exports: true, files: true, members: false, types: true });
});

test('resolveIncludedFromArgs (overlap)', async () => {
  const config = resolveIncludedFromArgs(['exports', 'files', 'members'], ['files', 'duplicates']);
  assert.deepEqual(config, { duplicates: false, exports: true, files: false, members: true, types: false });
});
