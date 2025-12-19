import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from '../../src/util/path.js';
import { resolve } from '../helpers/resolve.js';
import { describeFile } from './util.js';

const cwd = resolve('fixtures/session-re-exports');

test('counts imports via re-exports for implementation file', async () => {
  const { file } = await describeFile(cwd, 'implementation.ts');
  const mango = file.exports.find(entry => entry.identifier === 'Box');
  assert.ok(mango);
  const importFilePaths = mango.importLocations.map(loc => loc.filePath);
  assert.ok(importFilePaths.includes(join(cwd, 'consumer-1.ts')));
  assert.ok(importFilePaths.includes(join(cwd, 'consumer-2.ts')));
  assert.ok(importFilePaths.includes(join(cwd, 'consumer-3.ts')));
  assert.equal(mango.importLocations.length, 3);
});

test('counts imports via re-exports from barrel file', async () => {
  const { file } = await describeFile(cwd, 'barrel.ts');
  const mango = file.exports.find(entry => entry.identifier === 'Box');
  assert.ok(mango);
  const importFilePaths = mango.importLocations.map(loc => loc.filePath);
  assert.equal(mango.importLocations.length, 3);
  assert.ok(importFilePaths.includes(join(cwd, 'consumer-1.ts')));
  assert.ok(importFilePaths.includes(join(cwd, 'consumer-2.ts')));
  assert.ok(importFilePaths.includes(join(cwd, 'consumer-3.ts')));
  assert.equal(mango.importLocations.length, 3);
});
