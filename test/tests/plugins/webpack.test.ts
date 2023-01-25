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
  const dependencies = await webpack.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, {
    dependencies: [
      'svg-url-loader',
      'babel-loader',
      '@babel/preset-env',
      '@babel/preset-typescript',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-transform-react-jsx',
      'babel-plugin-macros',
      'babel-plugin-styled-components',
      'ts-loader',
      'esbuild-loader',
      'mini-css-extract-plugin',
      'css-loader',
      'less-loader',
      'svgo-loader',
      'base64-inline-loader',
      'webpack-cli',
      'webpack-dev-server',
    ],
    entryFiles: [path.join(cwd, 'src/app.ts'), path.join(cwd, 'src/vendor.ts'), path.join(cwd, 'src/entry.js')],
  });
});

test('Find dependencies in Webpack configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(path.join(cwd, 'src/unused.ts')));
  assert(issues.devDependencies['package.json']['@babel/plugin-proposal-object-rest-spread']);
  assert(issues.unlisted['webpack.config.js']['svgo-loader']);
  assert(issues.unlisted['webpack.dev.js']['eslint-webpack-plugin']);
  assert(issues.unlisted['webpack.prod.js']['terser-webpack-plugin']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    devDependencies: 1,
    unlisted: 3,
    processed: 11,
    total: 11,
  });
});
