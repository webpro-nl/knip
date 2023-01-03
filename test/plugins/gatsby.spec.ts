import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as gatsby from '../../src/plugins/gatsby/index.js';

const cwd = path.resolve('test/fixtures/plugins/gatsby');

test('Find dependencies in Gatsby configuration (gatsby-config.js)', async () => {
  const configFilePath = path.join(cwd, 'gatsby-config.js');
  const dependencies = await gatsby.findDependencies(configFilePath);
  assert.deepEqual(dependencies, [
    '@sentry/gatsby',
    'gatsby-plugin-webpack-bundle-analyser-v2',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-postcss',
    'gatsby-plugin-create-client-paths',
    'gatsby-source-filesystem',
    'gatsby-transformer-remark',
    'gatsby-remark-node-identity',
    'gatsby-remark-node-identity',
    'gatsby-plugin-manifest',
    'gatsby-plugin-remove-serviceworker',
  ]);
});

test('Find dependencies in Gatsby configuration (gatsby-node.js)', async () => {
  const configFilePath = path.join(cwd, 'gatsby-node.js');
  const dependencies = await gatsby.findDependencies(configFilePath);
  assert.deepEqual(dependencies, [
    '@babel/plugin-proposal-function-bind',
    '@babel/plugin-proposal-export-default-from',
    'babel-plugin-transform-imports',
  ]);
});
