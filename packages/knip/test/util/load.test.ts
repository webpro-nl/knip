import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { _load as load } from '../../src/util/loader.js';
import { join, resolve } from '../../src/util/path.js';

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
