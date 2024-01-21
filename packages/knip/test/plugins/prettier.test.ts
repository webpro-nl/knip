import assert from 'node:assert/strict';
import test from 'node:test';
import { default as prettier } from '../../src/plugins/prettier/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/prettier');
const options = buildOptions(cwd);

test('Find dependencies in Prettier configuration (.prettierrc)', async () => {
  const configFilePath = join(cwd, '.prettierrc');
  const dependencies = await prettier.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['prettier-plugin-xml']);
});

test('Find dependencies in Prettier configuration (package.json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await prettier.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['@company/prettier-config']);
});
