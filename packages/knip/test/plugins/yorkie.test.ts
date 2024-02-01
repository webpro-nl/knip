import assert from 'node:assert/strict';
import test from 'node:test';
import { default as yorkie } from '../../src/plugins/yorkie/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/yorkie');
const options = buildOptions(cwd);

test('Find dependencies in yorkie configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await yorkie.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['yorkie', 'bin:lint-staged']);
});
