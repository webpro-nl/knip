import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as nx from '../../../src/plugins/nx/index.js';

const cwd = path.resolve('test/fixtures/plugins/nx');

test('Find dependencies in Nx configuration (project.json)', async () => {
  const configFilePath = path.join(cwd, 'apps/a/project.json');
  const dependencies = await nx.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, ['@nrwl/next', '@nrwl/linter', '@nrwl/cypress']);
});
