import assert from 'node:assert/strict';
import test from 'node:test';
import { default as unbuild } from '../../src/plugins/unbuild/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/unbuild');
const options = buildOptions(cwd);

test('Find dependencies in unbuild configuration', async () => {
  const configFilePath = join(cwd, 'build.config.ts');
  const dependencies = await unbuild.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['entry:./src/index', 'entry:./src/package/components/']);
});
