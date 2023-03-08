import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as nyc from '../../src/plugins/nyc/index.js';

const cwd = path.resolve('tests/fixtures/plugins/nyc');

test('Find dependencies in nyc configuration', async () => {
  const configFilePath = path.join(cwd, '.nycrc.json');
  const dependencies = await nyc.findDependencies(configFilePath);
  assert.deepEqual(dependencies, ['@istanbuljs/nyc-config-typescript']);
});
