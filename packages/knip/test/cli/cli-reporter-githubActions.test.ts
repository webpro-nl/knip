import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const moduleCwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter github-actions (files, unlisted & unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: moduleCwd }).stdout,
    `src/unused.ts
::error file=src/index.ts::Unlisted dependencies
::error file=src/index.ts::Unlisted dependencies
::error file=src/index.ts,line=8,endLine=8,col=23,endColumn=23::Unresolved imports`
  );
});

const rulesCwd = resolve('fixtures/rules');

test('knip --reporter github-actions (rules: unused export, unused dep, unresolved)', () => {
  const output = exec('knip --reporter github-actions', { cwd: rulesCwd }).stdout;
  assert.match(output, /::warning file=exports\.ts,line=2,endLine=2,col=14,endColumn=14::Unused exports/);
  assert.match(output, /::warning file=ns\.ts,line=2,endLine=2,col=14,endColumn=14::Unused exports/);
  assert.match(output, /::warning file=package\.json::Unused dependencies/);
  assert.match(output, /::warning file=package\.json::Unused devDependencies/);
  assert.match(output, /::warning file=index\.ts,line=3,endLine=3,col=28,endColumn=28::Unresolved imports/);
});

const workspacesCwd = resolve('fixtures/workspaces');

test('knip --reporter github-actions (workspaces: unused export, unused dep, unlisted dep)', () => {
  const output = exec('knip --reporter github-actions', { cwd: workspacesCwd }).stdout;
  assert.match(output, /::error file=packages\/tools\/utils\.ts,line=3,endLine=3,col=14,endColumn=14::Unused exports/);
  assert.match(output, /::error file=package\.json,line=6,endLine=6,col=6,endColumn=6::Unused dependencies/);
  assert.match(output, /::error file=package\.json,line=8,endLine=8,col=6,endColumn=6::Unused dependencies/);
  assert.match(output, /::error file=.*::Unlisted dependencies/);
});

const nuxtCwd = resolve('fixtures/plugins/nuxt');

test('knip --reporter github-actions (nuxt: unused export, unused dep)', () => {
  const output = exec('knip --reporter github-actions', { cwd: nuxtCwd }).stdout;
  assert.match(output, /::error file=utils\/fn\.ts,line=3,endLine=3,col=14,endColumn=14::Unused exports/);
  assert.match(output, /::error file=package\.json,line=12,endLine=12,col=6,endColumn=6::Unused dependencies/);
});
