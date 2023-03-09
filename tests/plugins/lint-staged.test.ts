import assert from 'node:assert/strict';
import test from 'node:test';
import * as lintStaged from '../../src/plugins/lint-staged/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('tests/fixtures/plugins/lint-staged');
const manifest = getManifest(cwd);
const workspaceConfig = { ignoreBinaries: [] };

test('Find dependencies in lint-staged configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await lintStaged.findDependencies(configFilePath, { manifest, workspaceConfig });
  assert.deepEqual(dependencies, ['eslint', 'prettier']);
});

test('Find dependencies in lint-staged configuration (js)', async () => {
  const configFilePath = join(cwd, '.lintstagedrc.js');
  const dependencies = await lintStaged.findDependencies(configFilePath, { manifest, workspaceConfig });
  assert.deepEqual(dependencies, ['eslint', 'prettier']);
});
