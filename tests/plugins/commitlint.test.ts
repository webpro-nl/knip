import assert from 'node:assert/strict';
import test from 'node:test';
import * as commitlint from '../../src/plugins/commitlint/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('tests/fixtures/plugins/commitlint');

test('Find dependencies in commitlint configuration', async () => {
  const configFilePath = join(cwd, 'commitlint.config.js');
  const dependencies = await commitlint.findDependencies(configFilePath);
  assert.deepEqual(dependencies, ['@commitlint/config-conventional']);
});
