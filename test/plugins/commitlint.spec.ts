import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as commitlint from '../../src/plugins/commitlint/index.js';

const cwd = path.resolve('test/fixtures/plugins/commitlint');

test('Find dependencies in commitlint configuration', async () => {
  const configFilePath = path.join(cwd, 'commitlint.config.js');
  const dependencies = await commitlint.findDependencies(configFilePath);
  assert.deepEqual(dependencies, ['@commitlint/config-conventional']);
});
