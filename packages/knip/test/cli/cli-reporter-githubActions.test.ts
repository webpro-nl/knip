import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const moduleCwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter github-actions (files, unlisted & unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: moduleCwd }).stdout,
    `Unused files (1)
::error file=src/unused.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused files::src/unused.ts
Unlisted dependencies (2)
::error file=src/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::unresolved in src/index.ts
::error file=src/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::@org/unresolved in src/index.ts
Unresolved imports (1)
::error file=src/index.ts,line=8,endLine=8,col=23,endColumn=23,title=✂️ Knip / Unresolved imports::./unresolved in src/index.ts`
  );
});

const rulesCwd = resolve('fixtures/rules');

test('knip --reporter github-actions (rules: unused export, unused dep, unresolved)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: rulesCwd }).stdout,
    `Unused files (1)
::warning file=unused.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused files::unused.ts
Unused dependencies (1)
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused dependencies::unused in package.json
Unused devDependencies (1)
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused devDependencies::@dev/unused in package.json
Referenced optional peerDependencies (1)
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Referenced optional peerDependencies::optional-peer-dep in package.json
Unlisted dependencies (1)
::warning file=index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::unlisted in index.ts
Unlisted binaries (1)
::warning file=package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted binaries::unlisted in package.json
Unresolved imports (1)
::warning file=index.ts,line=3,endLine=3,col=28,endColumn=28,title=✂️ Knip / Unresolved imports::./unresolved in index.ts
Unused exports (2)
::warning file=ns.ts,line=2,endLine=2,col=14,endColumn=14,title=✂️ Knip / Unused exports::unused in ns.ts
::warning file=exports.ts,line=2,endLine=2,col=14,endColumn=14,title=✂️ Knip / Unused exports::unused in exports.ts
Unused exported types (2)
::warning file=ns.ts,line=5,endLine=5,col=13,endColumn=13,title=✂️ Knip / Unused exported types::UnusedType in ns.ts
::warning file=exports.ts,line=5,endLine=5,col=13,endColumn=13,title=✂️ Knip / Unused exported types::UnusedType in exports.ts
Unused exported enum members (1)
::warning file=exports.ts,line=15,endLine=15,col=3,endColumn=3,title=✂️ Knip / Unused exported enum members::unused in exports.ts
Unused exported class members (1)
::warning file=exports.ts,line=10,endLine=10,col=3,endColumn=3,title=✂️ Knip / Unused exported class members::unused in exports.ts
Duplicate exports (1)
::warning file=exports.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Duplicate exports::used|default in exports.ts`
  );
});

const workspacesCwd = resolve('fixtures/workspaces');

test('knip --reporter github-actions (workspaces: unused export, unused dep, unlisted dep)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: workspacesCwd }).stdout,
    `Unused files (1)
::error file=docs/dangling.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused files::docs/dangling.ts
Unused dependencies (4)
::error file=package.json,line=6,endLine=6,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::minimist in package.json
::error file=package.json,line=8,endLine=8,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::zod in package.json
::error file=apps/backend/package.json,line=7,endLine=7,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::picomatch in apps/backend/package.json
::error file=apps/backend/package.json,line=8,endLine=8,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::next in apps/backend/package.json
Unlisted dependencies (4)
::error file=packages/tools/tsconfig.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::@fixtures/workspaces__tsconfig in packages/tools/tsconfig.json
::error file=apps/frontend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::vanilla-js in apps/frontend/index.ts
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::js-yaml in apps/backend/index.ts
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::globby in apps/backend/index.ts
Unused exports (1)
::error file=packages/tools/utils.ts,line=3,endLine=3,col=14,endColumn=14,title=✂️ Knip / Unused exports::helperFn in packages/tools/utils.ts
Unused exported types (1)
::error file=packages/shared/types.ts,line=4,endLine=4,col=13,endColumn=13,title=✂️ Knip / Unused exported types::UnusedEnum in packages/shared/types.ts
Configuration hints (4)
::notice file=apps/frontend/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in apps/frontend/package.json
::notice file=apps/backend/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in apps/backend/package.json
::notice file=packages/shared/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in packages/shared/package.json
::notice file=packages/tools/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in packages/tools/package.json`
  );
});

test('knip --reporter github-actions (workspaces: config hints disabled)', () => {
  assert.equal(
    exec('knip --reporter github-actions --no-config-hints', { cwd: workspacesCwd }).stdout,
    `Unused files (1)
::error file=docs/dangling.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused files::docs/dangling.ts
Unused dependencies (4)
::error file=package.json,line=6,endLine=6,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::minimist in package.json
::error file=package.json,line=8,endLine=8,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::zod in package.json
::error file=apps/backend/package.json,line=7,endLine=7,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::picomatch in apps/backend/package.json
::error file=apps/backend/package.json,line=8,endLine=8,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::next in apps/backend/package.json
Unlisted dependencies (4)
::error file=packages/tools/tsconfig.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::@fixtures/workspaces__tsconfig in packages/tools/tsconfig.json
::error file=apps/frontend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::vanilla-js in apps/frontend/index.ts
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::js-yaml in apps/backend/index.ts
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::globby in apps/backend/index.ts
Unused exports (1)
::error file=packages/tools/utils.ts,line=3,endLine=3,col=14,endColumn=14,title=✂️ Knip / Unused exports::helperFn in packages/tools/utils.ts
Unused exported types (1)
::error file=packages/shared/types.ts,line=4,endLine=4,col=13,endColumn=13,title=✂️ Knip / Unused exported types::UnusedEnum in packages/shared/types.ts`
  );
});

test('knip --reporter github-actions (workspaces: config hints as errors)', () => {
  assert.equal(
    exec('knip --reporter github-actions --treat-config-hints-as-errors', { cwd: workspacesCwd }).stdout,
    `Unused files (1)
::error file=docs/dangling.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused files::docs/dangling.ts
Unused dependencies (4)
::error file=package.json,line=6,endLine=6,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::minimist in package.json
::error file=package.json,line=8,endLine=8,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::zod in package.json
::error file=apps/backend/package.json,line=7,endLine=7,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::picomatch in apps/backend/package.json
::error file=apps/backend/package.json,line=8,endLine=8,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::next in apps/backend/package.json
Unlisted dependencies (4)
::error file=packages/tools/tsconfig.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::@fixtures/workspaces__tsconfig in packages/tools/tsconfig.json
::error file=apps/frontend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::vanilla-js in apps/frontend/index.ts
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::js-yaml in apps/backend/index.ts
::error file=apps/backend/index.ts,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unlisted dependencies::globby in apps/backend/index.ts
Unused exports (1)
::error file=packages/tools/utils.ts,line=3,endLine=3,col=14,endColumn=14,title=✂️ Knip / Unused exports::helperFn in packages/tools/utils.ts
Unused exported types (1)
::error file=packages/shared/types.ts,line=4,endLine=4,col=13,endColumn=13,title=✂️ Knip / Unused exported types::UnusedEnum in packages/shared/types.ts
Configuration hints (4)
::error file=apps/frontend/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in apps/frontend/package.json
::error file=apps/backend/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in apps/backend/package.json
::error file=packages/shared/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in packages/shared/package.json
::error file=packages/tools/package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Package entry file not found: ./index.js in packages/tools/package.json`
  );
});

const nuxtCwd = resolve('fixtures/plugins/nuxt');

test('knip --reporter github-actions (nuxt: unused export, unused dep)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: nuxtCwd }).stdout,
    `Unused dependencies (1)
::error file=package.json,line=12,endLine=12,col=6,endColumn=6,title=✂️ Knip / Unused dependencies::vue in package.json
Unused exports (1)
::error file=utils/fn.ts,line=3,endLine=3,col=14,endColumn=14,title=✂️ Knip / Unused exports::unused in utils/fn.ts`
  );
});

const configHintsCwd = resolve('fixtures/configuration-hints');

test('knip --reporter github-actions (configuration hints)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: configHintsCwd }).stdout,
    `Unused files (1)
::error file=src/entry.js,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused files::src/entry.js
Configuration hints (2)
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Remove, or move unused top-level entry to one of "workspaces": [src/entry.js] in knip.json
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Remove, or move unused top-level project to one of "workspaces": [src/**] in knip.json`
  );
});

test('knip --reporter github-actions --no-config-hints', () => {
  assert.equal(
    exec('knip --reporter github-actions --no-config-hints', { cwd: configHintsCwd }).stdout,
    `Unused files (1)
::error file=src/entry.js,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Unused files::src/entry.js`
  );
});

const configHints2Cwd = resolve('fixtures/configuration-hints2');

test('knip --reporter github-actions (configuration hints 2)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: configHints2Cwd }).stdout,
    `Configuration hints (4)
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Refine entry pattern (no matches): lib/index.js in knip.json
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Refine project pattern (no matches): lib/** in knip.json
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Remove, or move unused top-level entry to one of "workspaces": [src/entry.js, …] in knip.json
::notice file=knip.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Remove, or move unused top-level project to one of "workspaces": [src/**] in knip.json`
  );
});

const treatConfigHintsAsErrorsCwd = resolve('fixtures/treat-config-hints-as-errors');

test('knip --reporter github-actions --treat-config-hints-as-errors', () => {
  assert.equal(
    exec('knip --reporter github-actions --treat-config-hints-as-errors', { cwd: treatConfigHintsAsErrorsCwd }).stdout,
    `Configuration hints (1)
::error file=package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Remove from ignoreDependencies: pineapple in package.json`
  );
});

const treatConfigHintsAsErrors2Cwd = resolve('fixtures/treat-config-hints-as-errors2');

test('knip --reporter github-actions (treatConfigHintsAsErrors: true)', () => {
  assert.equal(
    exec('knip --reporter github-actions', { cwd: treatConfigHintsAsErrors2Cwd }).stdout,
    `Configuration hints (1)
::error file=package.json,line=1,endLine=1,col=1,endColumn=1,title=✂️ Knip / Configuration hints::Remove from ignoreDependencies: bananas in package.json`
  );
});
