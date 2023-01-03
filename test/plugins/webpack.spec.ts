import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as webpack from '../../src/plugins/webpack/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest } from '../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/webpack');
const manifest = getManifest(cwd);

test('Find dependencies in Webpack configuration (webpack.config.js)', async () => {
  const configFilePath = path.join(cwd, 'webpack.config.js');
  const dependencies = await webpack.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['babel-loader', 'webpack-cli', 'webpack-dev-server']);
});

test('Find dependencies in Webpack configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['webpack.config.js']['babel-loader']);
  assert(issues.unlisted['webpack.config.js']['copy-webpack-plugin']);

  assert.deepEqual(counters, { ...baseCounters, unlisted: 2, processed: 1, total: 1 });
});
