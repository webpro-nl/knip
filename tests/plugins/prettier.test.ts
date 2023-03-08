import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as prettier from '../../src/plugins/prettier/index.js';

const cwd = path.resolve('tests/fixtures/plugins/prettier');

test('Find dependencies in Prettier configuration', async () => {
  const configFilePath = path.join(cwd, '.prettierrc');
  const dependencies = await prettier.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['prettier-plugin-xml']);
});
