import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { default as babel } from '../../src/plugins/babel/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/babel');
const options = buildOptions(cwd);

test('Find dependencies in Babel configuration (.babelrc)', async () => {
  const configFilePath = join(cwd, '.babelrc');
  const dependencies = await babel.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    '@babel/preset-env',
    '@babel/preset-typescript',
    'react-hot-loader/babel',
    '@babel/plugin-proposal-decorators',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-macros',
    'babel-preset-minify',
  ]);
});

test('Find dependencies in Babel configuration (.babelrc.js)', async () => {
  const configFilePath = join(cwd, '.babelrc.js');
  const dependencies = await babel.findDependencies(configFilePath, options);
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

test('Find dependencies in Babel configuration (babel.config.js)', async () => {
  const configFilePath = join(cwd, 'babel.config.js');
  const dependencies = await babel.findDependencies(configFilePath, options);
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

test('Find dependencies in Babel configuration (babel.config.cts)', async () => {
  const configFilePath = join(cwd, 'babel.config.cts');
  const dependencies = await babel.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    '/dir/preset.js',
    './dir/preset.js',
    'babel-preset-mod',
    'mod/preset',
    'babel-preset-mod2',
    '@babel/preset-mod',
    '@babel/preset-mod2',
    '@babel/mod/preset',
    '@scope/babel-preset',
    '@scope2/babel-preset',
    '@scope/babel-preset-mod',
    '@scope2/babel-preset-mod',
    '@scope/prefix-babel-preset-mod',
    '@scope/mod/preset',
    'my-preset',
    '/dir/plugin.js',
    './dir/plugin.js',
    'babel-plugin-mod',
    'mod/plugin',
    'babel-plugin-mod2',
    '@babel/plugin-mod',
    '@babel/plugin-mod2',
    '@babel/mod/plugin',
    '@scope/babel-plugin',
    '@scope2/babel-plugin',
    '@scope/babel-plugin-mod',
    '@scope2/babel-plugin-mod',
    '@scope/prefix-babel-plugin-mod',
    '@scope/mod/plugin',
    'my-plugin',
  ]);
});

test('Find dependencies in Babel configuration (package.json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await babel.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['@babel/preset-env']);
});

test('External dependency in Babel configuration (.babelrc.js)', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
  });

  // This verifies that .babelrc.js is added as entry file and its external module specifiers are found
  assert(issues.unlisted['.babelrc.js']['dotenv']);
});
