import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../../src/index.js';
import * as webpack from '../../../src/plugins/webpack/index.js';
import baseArguments from '../../helpers/baseArguments.js';
import baseCounters from '../../helpers/baseCounters.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/webpack');
const manifest = getManifest(cwd);

test('Find dependencies in Webpack configuration (webpack.config.js)', async () => {
  const configFilePath = path.join(cwd, 'webpack.config.js');
  const dependencies = await webpack.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    'svg-url-loader',
    'babel-loader',
    '@babel/preset-env',
    '@babel/preset-typescript',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-react-jsx',
    'babel-plugin-macros',
    'babel-plugin-styled-components',
    'ts-loader',
    'mini-css-extract-plugin',
    'css-loader',
    'less-loader',
    'base64-inline-loader',
    'webpack-cli',
    'webpack-dev-server',
  ]);
});

test('Find dependencies in Webpack configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@babel/plugin-proposal-object-rest-spread']);
  assert(issues.unlisted['webpack.dev.js']['eslint-webpack-plugin']);
  assert(issues.unlisted['webpack.prod.js']['terser-webpack-plugin']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 2,
    processed: 6,
    total: 6,
  });
});
