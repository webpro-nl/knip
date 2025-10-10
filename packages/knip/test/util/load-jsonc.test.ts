import assert from 'node:assert/strict';
import test from 'node:test';
import { _load as load } from '../../src/util/loader.js';
import { join } from '../../src/util/path.js';
import { resolve } from '../helpers/resolve.js';

// JSONC (JSON with Comments) tests
test('JSONC: File with comments', async () => {
  const cwd = resolve('fixtures/load-jsonc');
  const config = await load(join(cwd, 'with-comments.jsonc'));
  assert.equal(config.name, 'test-jsonc');
  assert.equal(config.version, '1.0.0');
  assert.equal(config.enabled, true);
  assert.deepEqual(config.features, ['comments', 'standard-json']);
});

test('JSONC: File with trailing commas', async () => {
  const cwd = resolve('fixtures/load-jsonc');
  const config = await load(join(cwd, 'with-trailing-commas.jsonc'));
  assert.equal(config.object.key1, 'value1');
  assert.equal(config.object.key2, 'value2');
  assert.equal(config.object.key3, 'value3');
  assert.deepEqual(config.array, ['item1', 'item2', 'item3']);
});

test('JSONC: Configuration file style', async () => {
  const cwd = resolve('fixtures/load-jsonc');
  const config = await load(join(cwd, 'config-style.jsonc'));
  assert.equal(config.editor.fontSize, 14);
  assert.equal(config.editor.tabSize, 2);
  assert.equal(config.editor.insertSpaces, true);
  assert.deepEqual(config.files.exclude, ['**/node_modules', '**/.git']);
  assert.equal(config.advanced.experimental, false);
});

test('JSONC: Mixed comment styles', async () => {
  const cwd = resolve('fixtures/load-jsonc');
  const config = await load(join(cwd, 'mixed-comments.jsonc'));
  assert.equal(config.data.value, 42);
  assert.equal(config.data.name, 'test');
  assert.deepEqual(config.data.list, [1, 2, 3]);
});
