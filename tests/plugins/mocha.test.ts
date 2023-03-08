import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as mocha from '../../src/plugins/mocha/index.js';
import { getManifest } from '../helpers/index.js';

const cwd = path.resolve('tests/fixtures/plugins/mocha');
const manifest = getManifest(cwd);

test('Find dependencies in Mocha configuration (.mocharc.json)', async () => {
  const configFilePath = path.join(cwd, '.mocharc.json');
  const dependencies = await mocha.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['ts-node']);
});

test('Find dependencies in Mocha configuration (package.json)', async () => {
  const configFilePath = path.join(cwd, 'package.json');
  const dependencies = await mocha.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['ts-node']);
});

test('Find dependencies in Mocha configuration (.mocharc.yml)', async () => {
  const configFilePath = path.join(cwd, '.mocharc.yml');
  const dependencies = await mocha.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['ts-node']);
});
