import assert from 'node:assert/strict';
import test from 'node:test';
import * as prettier from '../../src/plugins/prettier/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/prettier');
const manifest = getManifest(cwd);

test('Find dependencies in Prettier configuration (.prettierrc)', async () => {
  const configFilePath = join(cwd, '.prettierrc');
  const dependencies = await prettier.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['prettier-plugin-xml']);
});

test('Find dependencies in Prettier configuration (package.json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await prettier.findDependencies(configFilePath, {manifest});
  assert.deepEqual(dependencies, ['@company/prettier-config']);
});
