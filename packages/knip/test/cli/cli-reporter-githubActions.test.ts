import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const moduleCwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter github-actions (files, unlisted & unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: moduleCwd }).stdout,
    `${moduleCwd}/src/unused.ts
::error file=${moduleCwd}/src/index.ts::Unlisted dependencies
::error file=${moduleCwd}/src/index.ts::Unlisted dependencies
::error file=${moduleCwd}/src/index.ts,line=8,endLine=8,col=23,endColumn=23::Unresolved imports`
  );
});

const rulesCwd = resolve('fixtures/rules');

test('knip --reporter github-actions (rules: unused export, unused dep, unresolved)', () => {
  const output = exec('knip --reporter github-actions', { cwd: rulesCwd }).stdout;
  assert.match(output, new RegExp(`::warning file=${rulesCwd}/exports.ts.*Unused export`));
  assert.match(output, new RegExp(`::warning file=${rulesCwd}/package.json::Unused dependencies`));
  assert.match(output, new RegExp(`::warning file=${rulesCwd}/package.json::Unused devDependencies`));
  assert.match(output, new RegExp(`::warning file=${rulesCwd}/index.ts.*Unresolved imports`));
});

const workspacesCwd = resolve('fixtures/workspaces');

test('knip --reporter github-actions (workspaces: unused export, unused dep, unlisted dep)', () => {
  const output = exec('knip --reporter github-actions', { cwd: workspacesCwd }).stdout;
  assert.match(output, new RegExp(`::error file=${workspacesCwd}/.*Unused export`));
  assert.match(output, new RegExp(`::error file=${workspacesCwd}/.*Unused dependencies`));
  assert.match(output, new RegExp(`::error file=${workspacesCwd}/.*Unlisted dependencies`));
});

const nuxtCwd = resolve('fixtures/plugins/nuxt');

test('knip --reporter github-actions (nuxt: unused export, unused dep)', () => {
  const output = exec('knip --reporter github-actions', { cwd: nuxtCwd }).stdout;
  assert.match(output, new RegExp(`::error file=${nuxtCwd}/.*Unused export`));
  assert.match(output, new RegExp(`::error file=${nuxtCwd}/.*Unused dependencies`));
});
