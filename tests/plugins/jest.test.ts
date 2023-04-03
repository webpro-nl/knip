import assert from 'node:assert/strict';
// eslint-disable-next-line n/no-restricted-import
import path from 'node:path';
import test from 'node:test';
import * as jest from '../../src/plugins/jest/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('tests/fixtures/plugins/jest');

test('Find dependencies in Jest configuration (jest.config.js)', async () => {
  const configFilePath = join(cwd, 'jest.config.js');
  const dependencies = await jest.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, [
    'jest-environment-jsdom',
    path.join(cwd, 'node_modules/jest-watch-select-projects/index.js'),
    join(cwd, 'jest.setup.js'),
    '@nrwl/react/plugins/jest',
    'babel-jest',
    join(cwd, 'jest.transform.js'),
  ]);
});
