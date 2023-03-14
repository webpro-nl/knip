import assert from 'node:assert/strict';
import test from 'node:test';
import * as typedoc from '../../src/plugins/typedoc/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('tests/fixtures/plugins/typedoc');

test('Find dependencies in typedoc configuration (json)', async () => {
  const configFilePath = join(cwd, 'typedoc.json');
  const dependencies = await typedoc.findDependencies(configFilePath);
  assert.deepEqual(dependencies, [
    '@appium/typedoc-plugin-appium',
    'typedoc-plugin-expand-object-like-types',
    './dist/index.cjs',
  ]);
});
