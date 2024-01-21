import assert from 'node:assert/strict';
import test from 'node:test';
import { default as nx } from '../../src/plugins/nx/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/nx');
const options = buildOptions(cwd);

test('Find dependencies in Nx configuration (1)', async () => {
  const configFilePath = join(cwd, 'apps/a/project.json');
  const dependencies = await nx.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['@nrwl/next', '@nrwl/linter', '@nrwl/cypress']);
});

test('Find dependencies in Nx configuration (2)', async () => {
  const configFilePath = join(cwd, 'apps/b/project.json');
  const dependencies = await nx.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['@nx/next', '@nx/linter', '@js/cypress']);
});

test('Find dependencies in Nx configuration (3)', async () => {
  const configFilePath = join(cwd, 'libs/b/project.json');
  const dependencies = await nx.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['nx', '@nrwl/jest', 'bin:ls', 'bin:webpack', 'bin:compodoc']);
});
