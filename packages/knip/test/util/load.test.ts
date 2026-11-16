import assert from 'node:assert/strict';
import test from 'node:test';
import { loadYAMLDocuments } from '../../src/util/fs.ts';
import { _load as load } from '../../src/util/loader.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

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

test('Should not load multi-document YAML files by default', async () => {
  const cwd = resolve('fixtures/load-yaml-multi');
  await assert.rejects(load(join(cwd, 'flow.yaml')));
});

test('Should load all YAML documents', async () => {
  const cwd = resolve('fixtures/load-yaml-multi');
  assert.deepEqual(await loadYAMLDocuments(join(cwd, 'flow.yaml')), [
    { appId: 'com.example' },
    ['launchApp', { runScript: 'script.js' }],
  ]);
  assert.deepEqual(await loadYAMLDocuments(join(cwd, 'config.yaml')), [{ flows: ['*'] }]);
});
