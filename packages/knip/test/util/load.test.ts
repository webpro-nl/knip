import assert from 'node:assert/strict';
import test from 'node:test';
import { _load as load } from '../../src/util/loader.js';
import { join } from '../../src/util/path.js';
import { resolve } from '../helpers/resolve.js';

test('Should load modules (CommonJS)', async () => {
  const cwd = resolve('fixtures/load-cjs');
  await assert.doesNotReject(load(join(cwd, 'index.js')));
});

test('Should load modules (ESM)', async () => {
  const cwd = resolve('fixtures/load-esm');
  await assert.doesNotReject(load(join(cwd, 'index.js')));
});

test('Should load modules (ESM/TS)', async () => {
  const cwd = resolve('fixtures/load-esm-ts');
  await assert.doesNotReject(load(join(cwd, 'index.ts')));
});

test('Should load JSON5 files', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'config.json5'));
  assert.equal(config.name, 'test-config');
  assert.equal(config.plugins.length, 2);
  assert.equal(config.enabled, true);
});
