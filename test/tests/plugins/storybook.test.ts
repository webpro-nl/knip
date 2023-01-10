import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as storybook from '../../../src/plugins/storybook/index.js';

const cwd = path.resolve('test/fixtures/plugins/storybook');

test('Find dependencies in Storybook configuration (main.js)', async () => {
  const configFilePath = path.join(cwd, 'main.js');
  const dependencies = await storybook.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-knobs',
    'storybook-addon-export-to-codesandbox',
    '@storybook/builder-webpack5',
    '@storybook/manager-webpack5',
  ]);
});
