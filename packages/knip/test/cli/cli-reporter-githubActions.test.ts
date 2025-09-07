import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const moduleCwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter github-actions (files, unlisted & unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: moduleCwd }).stdout,
    `::error file=src/unused.ts::Unused files: src/unused.ts
::error file=src/index.ts::Unlisted dependencies: unresolved
::error file=src/index.ts::Unlisted dependencies: @org/unresolved
::error file=src/index.ts,line=8,endLine=8,col=23,endColumn=23::Unresolved imports: ./unresolved`
  );
});

const rulesCwd = resolve('fixtures/rules');

test('knip --reporter github-actions (rules: unused export, unused dep, unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: rulesCwd }).stdout,
    `::warning file=unused.ts::Unused files: unused.ts
::warning file=package.json::Unused dependencies: unused
::warning file=package.json::Unused devDependencies: @dev/unused
::warning file=package.json::Referenced optional peerDependencies: optional-peer-dep
::warning file=index.ts::Unlisted dependencies: unlisted
::warning file=package.json::Unlisted binaries: unlisted
::warning file=index.ts,line=3,endLine=3,col=28,endColumn=28::Unresolved imports: ./unresolved
::warning file=ns.ts,line=2,endLine=2,col=14,endColumn=14::Unused exports: unused
::warning file=exports.ts,line=2,endLine=2,col=14,endColumn=14::Unused exports: unused
::warning file=ns.ts,line=5,endLine=5,col=13,endColumn=13::Unused exported types: UnusedType
::warning file=exports.ts,line=5,endLine=5,col=13,endColumn=13::Unused exported types: UnusedType
::warning file=exports.ts,line=15,endLine=15,col=3,endColumn=3::Unused exported enum members: unused
::warning file=exports.ts,line=10,endLine=10,col=3,endColumn=3::Unused exported class members: unused
::warning file=exports.ts::Duplicate exports: used|default`
  );
});

const workspacesCwd = resolve('fixtures/workspaces');

test('knip --reporter github-actions (workspaces: unused export, unused dep, unlisted dep)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: workspacesCwd }).stdout,
    `::error file=docs/dangling.ts::Unused files: docs/dangling.ts
::error file=package.json,line=6,endLine=6,col=6,endColumn=6::Unused dependencies: minimist
::error file=package.json,line=8,endLine=8,col=6,endColumn=6::Unused dependencies: zod
::error file=apps/backend/package.json,line=7,endLine=7,col=6,endColumn=6::Unused dependencies: picomatch
::error file=apps/backend/package.json,line=8,endLine=8,col=6,endColumn=6::Unused dependencies: next
::error file=packages/tools/tsconfig.json::Unlisted dependencies: @fixtures/workspaces__tsconfig
::error file=apps/frontend/index.ts::Unlisted dependencies: vanilla-js
::error file=apps/backend/index.ts::Unlisted dependencies: js-yaml
::error file=apps/backend/index.ts::Unlisted dependencies: globby
::error file=packages/tools/utils.ts,line=3,endLine=3,col=14,endColumn=14::Unused exports: helperFn
::error file=packages/shared/types.ts,line=4,endLine=4,col=13,endColumn=13::Unused exported types: UnusedEnum`
  );
});

const nuxtCwd = resolve('fixtures/plugins/nuxt');

test('knip --reporter github-actions (nuxt: unused export, unused dep)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: nuxtCwd }).stdout,
    `::error file=package.json,line=12,endLine=12,col=6,endColumn=6::Unused dependencies: vue
::error file=utils/fn.ts,line=3,endLine=3,col=14,endColumn=14::Unused exports: unused`
  );
});
