import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as jest from '../../src/plugins/jest/index.js';

const cwd = path.resolve('test/fixtures/plugins/jest');

test('Unused dependencies in Jest configuration (jest.config.js)', async () => {
  const configFilePath = path.join(cwd, 'jest.config.js');
  const dependencies = await jest.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, ['jest-environment-jsdom', '@nrwl/react', 'babel-jest', 'jest-watch-select-projects']);
});
