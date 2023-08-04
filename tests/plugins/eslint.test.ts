import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveExtendsSpecifier } from '../../src/plugins/eslint/helpers.js';
import * as eslint from '../../src/plugins/eslint/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/eslint');
const manifest = getManifest(cwd);

test('Find dependencies in ESLint configuration (legacy json)', async () => {
  const configFilePath = join(cwd, '.eslintrc.json');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, [
    join(cwd, 'base.eslint.json'),
    'eslint-plugin-import',
    '@typescript-eslint/parser',
    'eslint-config-airbnb',
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-prettier',
    'eslint-config-prettier',
    '@babel/plugin-syntax-import-assertions',
  ]);
});

test('Find dependencies in ESLint configuration (legacy js)', async () => {
  const configFilePath = join(cwd, '.eslintrc.js');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, [
    join(cwd, 'base.eslint.json'),
    'eslint-plugin-import',
    '@typescript-eslint/parser',
    'eslint-config-airbnb',
    '@typescript-eslint/eslint-plugin',
    'eslint-config-next',
    '@next/eslint-plugin-next',
    'eslint-plugin-eslint-comments',
    'eslint-plugin-eslint-plugin',
    '@scope/eslint-config/file',
    'eslint-plugin-prettier',
    'eslint-config-prettier',
    '@nrwl/eslint-plugin-nx',
    'eslint-plugin-cypress',
    '@scope/eslint-plugin',
    'eslint-import-resolver-typescript',
    'eslint-import-resolver-exports',
  ]);
});

test('Find dependencies in ESLint configuration (legacy yaml)', async () => {
  const configFilePath = join(cwd, '.eslintrc.yml');
  const dependencies = await eslint.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, ['@sinonjs/eslint-config', '@sinonjs/eslint-plugin-no-prototype-methods']);
});

test('ESLint configuration resolveExtendsSpecifier helper', () => {
  const r = resolveExtendsSpecifier;

  assert.equal(r('./local.eslint.json'), undefined);
  assert.equal(r('eslint:recommended'), undefined);

  assert.equal(r('airbnb'), 'eslint-config-airbnb');
  assert.equal(r('next/core-web-vitals'), 'eslint-config-next');
  assert.equal(r('@scope/eslint-config/file'), '@scope/eslint-config/file');

  // plugin:
  assert.equal(r('plugin:eslint-comments/recommended'), 'eslint-plugin-eslint-comments');
  assert.equal(r('plugin:@next/next/core-web-vitals'), '@next/eslint-plugin-next');
  assert.equal(r('plugin:eslint-plugin/all'), 'eslint-plugin-eslint-plugin');
  assert.equal(r('plugin:prettier/recommended'), 'eslint-plugin-prettier');

  // @typescript-eslint/eslint-plugin
  assert.equal(r('plugin:@typescript-eslint/eslint-recommended'), '@typescript-eslint/eslint-plugin');
  assert.equal(r('plugin:@typescript-eslint/recommended'), '@typescript-eslint/eslint-plugin');
  assert.equal(r('plugin:@typescript-eslint/recommended-requiring-type-checking'), '@typescript-eslint/eslint-plugin');
  assert.equal(r('plugin:@typescript-eslint/strict'), '@typescript-eslint/eslint-plugin');
  assert.equal(r('plugin:@typescript-eslint/stylistic'), '@typescript-eslint/eslint-plugin');
  assert.equal(r('plugin:@typescript-eslint/strict-type-checked'), '@typescript-eslint/eslint-plugin');
  assert.equal(r('plugin:@typescript-eslint/stylistic-type-checked'), '@typescript-eslint/eslint-plugin');
  assert.equal(r('plugin:@typescript-eslint/disable-type-checked'), '@typescript-eslint/eslint-plugin');
});
