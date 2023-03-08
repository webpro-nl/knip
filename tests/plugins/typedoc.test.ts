import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as typedoc from '../../src/plugins/typedoc/index.js';

const cwd = path.resolve('tests/fixtures/plugins/typedoc');

test('Find dependencies in typedoc configuration (json)', async () => {
  const configFilePath = path.join(cwd, 'typedoc.json');
  const dependencies = await typedoc.findDependencies(configFilePath);
  assert.deepEqual(dependencies, ['@appium/typedoc-plugin-appium', 'typedoc-plugin-expand-object-like-types']);
});
