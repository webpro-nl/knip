import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const moduleCwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter github-actions (files, unlisted & unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: moduleCwd }).stdout,
    `::error file=src/unused.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused files: src/unused.ts
::error file=src/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: unresolved
::error file=src/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: @org/unresolved
::error file=src/index.ts,line=8,endLine=8,col=23,endColumn=23,title=Knip::Unresolved imports: ./unresolved`
  );
});

const rulesCwd = resolve('fixtures/rules');

test('knip --reporter github-actions (rules: unused export, unused dep, unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: rulesCwd }).stdout,
    `::warning file=unused.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused files: unused.ts
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused dependencies: unused
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused devDependencies: @dev/unused
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Referenced optional peerDependencies: optional-peer-dep
::warning file=index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: unlisted
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted binaries: unlisted
::warning file=index.ts,line=3,endLine=3,col=28,endColumn=28,title=Knip::Unresolved imports: ./unresolved
::warning file=ns.ts,line=2,endLine=2,col=14,endColumn=14,title=Knip::Unused exports: unused
::warning file=exports.ts,line=2,endLine=2,col=14,endColumn=14,title=Knip::Unused exports: unused
::warning file=ns.ts,line=5,endLine=5,col=13,endColumn=13,title=Knip::Unused exported types: UnusedType
::warning file=exports.ts,line=5,endLine=5,col=13,endColumn=13,title=Knip::Unused exported types: UnusedType
::warning file=exports.ts,line=15,endLine=15,col=3,endColumn=3,title=Knip::Unused exported enum members: unused
::warning file=exports.ts,line=10,endLine=10,col=3,endColumn=3,title=Knip::Unused exported class members: unused
::warning file=exports.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Duplicate exports: used|default`
  );
});

const workspacesCwd = resolve('fixtures/workspaces');

test('knip --reporter github-actions (workspaces: unused export, unused dep, unlisted dep)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: workspacesCwd }).stdout,
    `::error file=docs/dangling.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused files: docs/dangling.ts
::error file=package.json,line=6,endLine=6,col=6,endColumn=6,title=Knip::Unused dependencies: minimist
::error file=package.json,line=8,endLine=8,col=6,endColumn=6,title=Knip::Unused dependencies: zod
::error file=apps/backend/package.json,line=7,endLine=7,col=6,endColumn=6,title=Knip::Unused dependencies: picomatch
::error file=apps/backend/package.json,line=8,endLine=8,col=6,endColumn=6,title=Knip::Unused dependencies: next
::error file=packages/tools/tsconfig.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: @fixtures/workspaces__tsconfig
::error file=apps/frontend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: vanilla-js
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: js-yaml
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: globby
::error file=packages/tools/utils.ts,line=3,endLine=3,col=14,endColumn=14,title=Knip::Unused exports: helperFn
::error file=packages/shared/types.ts,line=4,endLine=4,col=13,endColumn=13,title=Knip::Unused exported types: UnusedEnum
::notice file=apps/frontend/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js
::notice file=apps/backend/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js
::notice file=packages/shared/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js
::notice file=packages/tools/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js`
  );
});

test('knip --reporter github-actions (workspaces: config hints disabled)', () => {
  assert.equal(
    exec('knip --reporter github-actions --no-config-hints', { cwd: workspacesCwd }).stdout,
    `::error file=docs/dangling.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused files: docs/dangling.ts
::error file=package.json,line=6,endLine=6,col=6,endColumn=6,title=Knip::Unused dependencies: minimist
::error file=package.json,line=8,endLine=8,col=6,endColumn=6,title=Knip::Unused dependencies: zod
::error file=apps/backend/package.json,line=7,endLine=7,col=6,endColumn=6,title=Knip::Unused dependencies: picomatch
::error file=apps/backend/package.json,line=8,endLine=8,col=6,endColumn=6,title=Knip::Unused dependencies: next
::error file=packages/tools/tsconfig.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: @fixtures/workspaces__tsconfig
::error file=apps/frontend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: vanilla-js
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: js-yaml
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: globby
::error file=packages/tools/utils.ts,line=3,endLine=3,col=14,endColumn=14,title=Knip::Unused exports: helperFn
::error file=packages/shared/types.ts,line=4,endLine=4,col=13,endColumn=13,title=Knip::Unused exported types: UnusedEnum`
  );
});

test('knip --reporter github-actions (workspaces: config hints as errors)', () => {
  assert.equal(
    exec('knip --reporter github-actions --treat-config-hints-as-errors', { cwd: workspacesCwd }).stdout,
    `::error file=docs/dangling.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused files: docs/dangling.ts
::error file=package.json,line=6,endLine=6,col=6,endColumn=6,title=Knip::Unused dependencies: minimist
::error file=package.json,line=8,endLine=8,col=6,endColumn=6,title=Knip::Unused dependencies: zod
::error file=apps/backend/package.json,line=7,endLine=7,col=6,endColumn=6,title=Knip::Unused dependencies: picomatch
::error file=apps/backend/package.json,line=8,endLine=8,col=6,endColumn=6,title=Knip::Unused dependencies: next
::error file=packages/tools/tsconfig.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: @fixtures/workspaces__tsconfig
::error file=apps/frontend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: vanilla-js
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: js-yaml
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unlisted dependencies: globby
::error file=packages/tools/utils.ts,line=3,endLine=3,col=14,endColumn=14,title=Knip::Unused exports: helperFn
::error file=packages/shared/types.ts,line=4,endLine=4,col=13,endColumn=13,title=Knip::Unused exported types: UnusedEnum
::error file=apps/frontend/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js
::error file=apps/backend/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js
::error file=packages/shared/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js
::error file=packages/tools/package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Package entry file not found: ./index.js`
  );
});

const nuxtCwd = resolve('fixtures/plugins/nuxt');

test('knip --reporter github-actions (nuxt: unused export, unused dep)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: nuxtCwd }).stdout,
    `::error file=package.json,line=12,endLine=12,col=6,endColumn=6,title=Knip::Unused dependencies: vue
::error file=utils/fn.ts,line=3,endLine=3,col=14,endColumn=14,title=Knip::Unused exports: unused`
  );
});

const configHintsCwd = resolve('fixtures/configuration-hints');

test('knip --reporter github-actions (configuration hints)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: configHintsCwd }).stdout,
    `::error file=src/entry.js,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused files: src/entry.js
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Remove, or move unused top-level entry to one of "workspaces": [src/entry.js]
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Remove, or move unused top-level project to one of "workspaces": [src/**]`
  );
});

test('knip --reporter github-actions --no-config-hints', () => {
  assert.equal(
    exec('knip --reporter github-actions --no-config-hints', { cwd: configHintsCwd }).stdout,
    `::error file=src/entry.js,line=1,endLine=1,col=1,endColumn=1,title=Knip::Unused files: src/entry.js`
  );
});

const configHints2Cwd = resolve('fixtures/configuration-hints2');

test('knip --reporter github-actions (configuration hints 2)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: configHints2Cwd }).stdout,
    `::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Refine entry pattern (no matches): lib/index.js
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Refine project pattern (no matches): lib/**
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Remove, or move unused top-level entry to one of "workspaces": [src/entry.js, …]
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Remove, or move unused top-level project to one of "workspaces": [src/**]`
  );
});

const treatConfigHintsAsErrorsCwd = resolve('fixtures/treat-config-hints-as-errors');

test('knip --reporter github-actions --treat-config-hints-as-errors', () => {
  assert.equal(
    exec('knip --reporter github-actions --treat-config-hints-as-errors', { cwd: treatConfigHintsAsErrorsCwd }).stdout,
    `::error file=package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Remove from ignoreDependencies: pineapple`
  );
});

const treatConfigHintsAsErrors2Cwd = resolve('fixtures/treat-config-hints-as-errors2');

test('knip --reporter github-actions (treatConfigHintsAsErrors: true)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: treatConfigHintsAsErrors2Cwd }).stdout,
    `::error file=package.json,line=1,endLine=1,col=1,endColumn=1,title=Knip::Remove from ignoreDependencies: bananas`
  );
});
