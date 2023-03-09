import assert from 'node:assert/strict';
import test from 'node:test';
import * as jest from '../../src/plugins/jest/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('tests/fixtures/plugins/jest');

test('Find dependencies in Jest configuration (jest.config.js)', async () => {
  const configFilePath = join(cwd, 'jest.config.js');
  const dependencies = await jest.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, {
    dependencies: ['jest-environment-jsdom', '@nrwl/react', 'babel-jest', 'jest-watch-select-projects'],
    entryFiles: [join(cwd, 'jest.setup.js'), join(cwd, 'jest.transform.js')],
  });
});
