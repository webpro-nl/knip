import assert from 'node:assert/strict';
import test from 'node:test';
import { default as lefthook } from '../../src/plugins/lefthook/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/lefthook');
const options = buildOptions(cwd);

test('Find dependencies in lefthook configuration (json)', async () => {
  const CI = process.env.CI;
  process.env.CI = '';
  const configFilePath = join(cwd, 'lefthook.yml');
  const dependencies = await lefthook.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [join(cwd, 'example.mjs'), 'bin:eslint']);
  process.env.CI = CI;
});
