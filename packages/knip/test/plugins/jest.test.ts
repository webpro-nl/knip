import assert from 'node:assert/strict';
// eslint-disable-next-line n/no-restricted-import
import path from 'node:path';
import test from 'node:test';
import { default as jest } from '../../src/plugins/jest/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/jest');
const options = buildOptions(cwd);

test('Find dependencies in Jest configuration (jest.config.js)', async () => {
  const configFilePath = join(cwd, 'jest.config.js');
  const dependencies = await jest.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    'entry:**/*-test.[jt]s?(x)',
    './local-preset/jest-preset.js',
    'entry:**/*.js',
    'jest-runner-eslint',
    'jest-environment-jsdom',
    'jest-silent-reporter',
    'jest-junit',
    path.join(cwd, 'node_modules/jest-watch-select-projects/index.js'),
    join(cwd, 'jest.setup.js'),
    '@nrwl/react/plugins/jest',
    'babel-jest',
    join(cwd, 'jest.transform.js'),
    join(cwd, '__mocks__/fileMock.js'),
    'identity-obj-proxy',
    'jest-phabricator',
    join(cwd, 'snapshotResolver.js'),
  ]);
});
