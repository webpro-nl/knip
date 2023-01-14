import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as lintStaged from '../../../src/plugins/lint-staged/index.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/lint-staged');
const manifest = getManifest(cwd);
const rootConfig = { ignoreBinaries: [] };

test('Find dependencies in lint-staged configuration (json)', async () => {
  const configFilePath = path.join(cwd, 'package.json');
  const dependencies = await lintStaged.findDependencies(configFilePath, { manifest, rootConfig });
  assert.deepEqual(dependencies, ['eslint', 'prettier']);
});

test('Find dependencies in lint-staged configuration (js)', async () => {
  const configFilePath = path.join(cwd, '.lintstagedrc.js');
  const dependencies = await lintStaged.findDependencies(configFilePath, { manifest, rootConfig });
  assert.deepEqual(dependencies, ['eslint', 'prettier']);
});
