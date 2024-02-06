import assert from 'node:assert/strict';
import test from 'node:test';
import { default as nx } from '../../src/plugins/nx/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/nx-crystal');
const options = buildOptions(cwd);

test('Find dependencies in Nx configuration nx.json', async () => {
  const configFilePath = join(cwd, 'nx.json');
  const dependencies = await nx.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    '@nx/rollup',
    '@nx/webpack',
    '@nx/eslint',
    '@nx/playwright',
    '@nx/jest',
    '@nx/vite',
    '@nx/react',
  ]);
});
