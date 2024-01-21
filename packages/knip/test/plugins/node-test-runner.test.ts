import assert from 'node:assert/strict';
import test from 'node:test';
import { default as nodeTestRunner } from '../../src/plugins/node-test-runner/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/node-test-runner');
const options = buildOptions(cwd);

test('Find dependencies in node-test-runner configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await nodeTestRunner.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    'entry:**/*{.,-,_}test.?(c|m)js',
    'entry:**/test-*.?(c|m)js',
    'entry:**/test.?(c|m)js',
    'entry:**/test/**/*.?(c|m)js',
  ]);
});
