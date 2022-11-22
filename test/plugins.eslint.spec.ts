import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as eslint from '../src/plugins/eslint/index';

const cwd = path.resolve('test/fixtures/eslint');

test('Unused dependencies in ESLint configuration (legacy json)', async () => {
  const configFilePath = path.join(cwd, '.eslintrc.json');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, [
    '@typescript-eslint/parser',
    'eslint-plugin-import',
    'eslint-plugin-prettier',
    '@typescript-eslint/eslint-plugin',
  ]);
});

test('Unused dependencies in ESLint configuration (legacy commonjs)', async () => {
  const configFilePath = path.join(cwd, '.eslintrc.js');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, [
    '@typescript-eslint/parser',
    'eslint-plugin-import',
    'eslint-plugin-prettier',
    '@nrwl/nx',
    '@typescript-eslint/eslint-plugin',
  ]);
});

test('Unused dependencies in ESLint configuration (eslint.config.js)', async () => {
  const configFilePath = path.join(cwd, 'eslint.config.js');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, []);
});
