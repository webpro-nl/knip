import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findFileUp } from '../../src/util/fs.ts';

test('findFileUp should not traverse past a Windows drive root', () => {
  assert.equal(findFileUp('Z:/__knip_missing__/pkg', 'package.json'), undefined);
});

test('findFileUp should not traverse past a UNC share root', () => {
  assert.equal(findFileUp('//__knip_server__/__knip_share__/pkg', 'etc/hosts'), undefined);
});
