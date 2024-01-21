import assert from 'node:assert/strict';
import test from 'node:test';
import { default as __PLUGIN_CAMELCASED_NAME__ } from '../../src/plugins/_template/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/_template');
const options = buildOptions(cwd);

test('Find dependencies in _template configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await __PLUGIN_CAMELCASED_NAME__.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, []);
});
