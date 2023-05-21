import assert from 'node:assert/strict';
import test from 'node:test';
import * as storybook from '../../src/plugins/storybook/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('tests/fixtures/plugins/storybook');

test('Find dependencies in Storybook configuration (main.js)', async () => {
  const configFilePath = join(cwd, 'main.js');
  const dependencies = await storybook.findDependencies(configFilePath);
  assert.deepEqual(dependencies, [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-knobs/preset',
    'storybook-addon-export-to-codesandbox',
    './addon/register',
    '@storybook/builder-webpack5',
    '@storybook/manager-webpack5',
    '@storybook/react-webpack5',
  ]);
});
