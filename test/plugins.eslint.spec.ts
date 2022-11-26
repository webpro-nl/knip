import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as eslint from '../src/plugins/eslint/index';
import { getManifest } from './helpers';

const cwd = path.resolve('test/fixtures/eslint');
const manifest = getManifest(cwd);
const workspaceConfig = {
  entryFiles: ['index.{js,ts,tsx}', 'src/index.{js,ts,tsx}'],
  projectFiles: ['**/*.{js,ts,tsx}'],
  ignore: [],
  paths: {},
};

test('Unused dependencies in ESLint configuration (legacy json)', async () => {
  const configFilePath = path.join(cwd, '.eslintrc.json');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest, workspaceConfig });
  assert.deepEqual(dependencies, [
    'eslint-plugin-airbnb',
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-prettier',
    '@typescript-eslint/parser',
    'eslint-plugin-import',
  ]);
});

test('Unused dependencies in ESLint configuration (legacy js)', async () => {
  const configFilePath = path.join(cwd, '.eslintrc.js');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest, workspaceConfig });
  assert.deepEqual(dependencies, [
    'eslint-plugin-airbnb',
    'eslint-plugin-prettier',
    '@typescript-eslint/eslint-plugin',
    '@scope/eslint-config',
    '@typescript-eslint/parser',
    'eslint-plugin-import',
    '@nrwl/nx',
  ]);
});
