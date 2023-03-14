import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as ava from '../../../src/plugins/ava/index.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/ava');
const manifest = getManifest(cwd);
const rootConfig = { ignoreBinaries: ['knip'] };

test('Find dependencies in ava configuration (package.json)', async () => {
  const configFilePath = path.join(cwd, 'package.json');
  const dependencies = await ava.findDependencies(configFilePath, { cwd, manifest, rootConfig });
  assert.deepEqual(dependencies, ['ts-node']);
});

test('Find dependencies in ava configuration (ava.config.mjs)', async () => {
  const configFilePath = path.join(cwd, 'ava.config.mjs');
  const dependencies = await ava.findDependencies(configFilePath, { cwd, manifest, rootConfig });
  assert.deepEqual(dependencies, ['tsconfig-paths']);
});
