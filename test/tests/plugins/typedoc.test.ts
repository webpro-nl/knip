import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as typedoc from '../../../src/plugins/typedoc/index.js';

const cwd = path.resolve('test/fixtures/plugins/typedoc');

test('Find dependencies in typedoc configuration (json)', async () => {
  const configFilePath = path.join(cwd, 'typedoc.json');
  const dependencies = await typedoc.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, {
    dependencies: ['@appium/typedoc-plugin-appium', 'typedoc-plugin-expand-object-like-types'],
    entryFiles: [path.join(cwd, 'dist/index.cjs')],
  });
});
