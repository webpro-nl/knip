import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as babel from '../../src/plugins/babel/index.js';
import { getManifest } from '../helpers';

const cwd = path.resolve('test/fixtures/babel');
const manifest = getManifest(cwd);

test('Unused dependencies in Babel configuration (.babelrc)', async () => {
  const configFilePath = path.join(cwd, '.babelrc');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    '@babel/preset-env',
    '@babel/preset-typescript',
    'react-hot-loader',
    '@babel/plugin-proposal-decorators',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-macros',
    'babel-preset-minify',
  ]);
});

test('Unused dependencies in Babel configuration (.babelrc.js)', async () => {
  const configFilePath = path.join(cwd, '.babelrc.js');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    '@babel/preset-env',
    '@babel/preset-typescript',
    'babel-plugin-preval',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-macros',
    '@babel/plugin-transform-runtime',
    'babel-plugin-transform-imports',
  ]);
});

test('Unused dependencies in Babel configuration (babel.config.js)', async () => {
  const configFilePath = path.join(cwd, 'babel.config.js');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    '@babel/preset-env',
    '@babel/preset-typescript',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-runtime',
    'babel-plugin-lodash',
  ]);
});

test('Unused dependencies in Babel configuration (package.json)', async () => {
  const configFilePath = path.join(cwd, 'package.json');
  const dependencies = await babel.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['@babel/preset-env']);
});
