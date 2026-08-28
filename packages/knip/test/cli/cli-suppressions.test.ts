import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import type { Suppressions } from '../../src/types/suppressions.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { exec } from '../helpers/exec.ts';

const FILE = '.knip-suppressions.json';

const write = (cwd: string, suppressions: Suppressions['suppressions']) =>
  writeFile(join(cwd, FILE), JSON.stringify({ version: 1, suppressions }, null, 2));

const read = (cwd: string) => readFile(join(cwd, FILE), 'utf8');

test('--check-suppressions does not write, and reports issues before failing', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    'module.ts': { exports: { unusedExport: {}, ghostThatNoLongerExists: {} } },
  });
  const before = await read(cwd);

  const { stdout, status } = exec('knip --check-suppressions', { cwd });

  assert.equal(await read(cwd), before);
  assert.match(stdout, /anotherUnused/);
  assert.match(stdout, /unused-pkg/);
  assert.match(stdout, /1 suppression no longer applies/);
  assert.equal(status, 1);
});

test('--check-suppressions exits zero when the file is up to date', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  const before = await read(cwd);

  const { status } = exec('knip --check-suppressions', { cwd });

  assert.equal(await read(cwd), before);
  assert.equal(status, 0);
});

const stale = {
  'module.ts': { exports: { unusedExport: {}, anotherUnused: {}, ghostThatNoLongerExists: {} } },
  'package.json': { dependencies: { 'unused-pkg': {}, 'used-pkg': {} } },
  'unused.ts': { files: { 'unused.ts': {} } },
};

test('Regular run never writes the suppressions file', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, stale);
  const before = await read(cwd);

  const { stdout, status } = exec('knip', { cwd });

  assert.equal(await read(cwd), before);
  assert.match(stdout, /1 suppression no longer applies/);
  assert.match(stdout, /--prune-suppressions/);
  assert.equal(status, 0);
});

test('--prune-suppressions removes entries that no longer apply', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, stale);

  const { stdout, status } = exec('knip --prune-suppressions', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['module.ts']?.exports?.['unusedExport']);
  assert(!after.suppressions['module.ts']?.exports?.['ghostThatNoLongerExists']);
  assert.match(stdout, /Pruned 1 suppression/);
  assert.equal(status, 0);
});

test('--prune-suppressions leaves an up-to-date file byte-identical', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  const before = await read(cwd);

  exec('knip --prune-suppressions', { cwd });

  assert.equal(await read(cwd), before);
});

test('Workspace-scoped run leaves other workspaces suppressions intact', async () => {
  const cwd = await copyFixture('fixtures/suppressions-workspaces');
  await write(cwd, {
    'workspace-a/module.ts': { exports: { unusedA: {} } },
    'workspace-b/module.ts': { exports: { unusedB: {} } },
  });

  exec('knip --prune-suppressions -W workspace-a', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(after.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
});

test('Workspace-scoped run still prunes within its own workspace', async () => {
  const cwd = await copyFixture('fixtures/suppressions-workspaces');
  await write(cwd, {
    'workspace-a/module.ts': { exports: { unusedA: {}, ghostThatNoLongerExists: {} } },
    'workspace-b/module.ts': { exports: { unusedB: {} } },
  });

  exec('knip --prune-suppressions -W workspace-a', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(!after.suppressions['workspace-a/module.ts']?.exports?.['ghostThatNoLongerExists']);
  assert(after.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
});

test('Issue-type-scoped run leaves other issue types suppressions intact', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  const before = await read(cwd);

  exec('knip --prune-suppressions --exports', { cwd });

  assert.equal(await read(cwd), before);
});

test('Issue-type-scoped run still prunes within its own issue type', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    'module.ts': { exports: { unusedExport: {}, anotherUnused: {}, ghostThatNoLongerExists: {} } },
    'package.json': { dependencies: { 'unused-pkg': {}, 'used-pkg': {} } },
    'unused.ts': { files: { 'unused.ts': {} } },
  });

  exec('knip --prune-suppressions --exports', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(!after.suppressions['module.ts']?.exports?.['ghostThatNoLongerExists']);
  assert(after.suppressions['module.ts']?.exports?.['unusedExport']);
  assert(after.suppressions['package.json']?.dependencies?.['unused-pkg']);
  assert(after.suppressions['unused.ts']?.files?.['unused.ts']);
});

test('Config-scoped run leaves the other config suppressions intact', async () => {
  const cwd = await copyFixture('fixtures/suppressions-configs');
  await write(cwd, {
    'client/renderer.ts': { exports: { unusedRenderHook: {} } },
    'server/listener.ts': { exports: { unusedListenHook: {} } },
  });

  exec('knip --prune-suppressions -c knip.client.json', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['client/renderer.ts']?.exports?.['unusedRenderHook']);
  assert(after.suppressions['server/listener.ts']?.exports?.['unusedListenHook']);
});

test('Config-scoped run still prunes within its own config', async () => {
  const cwd = await copyFixture('fixtures/suppressions-configs');
  await write(cwd, {
    'client/renderer.ts': { exports: { unusedRenderHook: {}, ghostThatNoLongerExists: {} } },
    'server/listener.ts': { exports: { unusedListenHook: {} } },
  });

  exec('knip --prune-suppressions -c knip.client.json', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['client/renderer.ts']?.exports?.['unusedRenderHook']);
  assert(!after.suppressions['client/renderer.ts']?.exports?.['ghostThatNoLongerExists']);
  assert(after.suppressions['server/listener.ts']?.exports?.['unusedListenHook']);
});

test('Full prune removes entries for files that no longer exist', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    'module.ts': { exports: { unusedExport: {}, anotherUnused: {} } },
    'package.json': { dependencies: { 'unused-pkg': {}, 'used-pkg': {} } },
    'unused.ts': { files: { 'unused.ts': {} } },
    'deleted-file.ts': { exports: { gone: {} } },
  });

  exec('knip --prune-suppressions', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(!after.suppressions['deleted-file.ts']);
  assert(after.suppressions['module.ts']?.exports?.['unusedExport']);
  assert(after.suppressions['package.json']?.dependencies?.['unused-pkg']);
});

test('Full prune removes dependency entries that no longer apply', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    'module.ts': { exports: { unusedExport: {}, anotherUnused: {} } },
    'package.json': { dependencies: { 'unused-pkg': {}, 'used-pkg': {}, 'never-listed-pkg': {} } },
    'unused.ts': { files: { 'unused.ts': {} } },
  });

  exec('knip --prune-suppressions', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['package.json']?.dependencies?.['unused-pkg']);
  assert(!after.suppressions['package.json']?.dependencies?.['never-listed-pkg']);
});

test('--suppress-all converges a conflicted file in one run', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    // as if both sides of a merge landed: one entry fixed on theirs, one stale from ours
    'module.ts': { exports: { unusedExport: {}, ghostFromTheirBranch: {} } },
    'package.json': { dependencies: { 'unused-pkg': {}, 'used-pkg': {} } },
    'unused.ts': { files: { 'unused.ts': {} } },
  });

  exec('knip --suppress-all', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['module.ts']?.exports?.['anotherUnused']);
  assert(after.suppressions['module.ts']?.exports?.['unusedExport']);
  assert(!after.suppressions['module.ts']?.exports?.['ghostFromTheirBranch']);
  assert.equal(exec('knip', { cwd }).status, 0);
});

test('--suppress-all preserves arbitrary metadata on entries it keeps', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    'module.ts': { exports: { unusedExport: { until: '2099-12-31' } } },
  });

  exec('knip --suppress-all', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert.equal(after.suppressions['module.ts']?.exports?.['unusedExport']?.until, '2099-12-31');
  assert(after.suppressions['module.ts']?.exports?.['anotherUnused']);
});

test('Scope flags filter what --suppress-all writes', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await writeFile(join(cwd, FILE), JSON.stringify({ version: 1, suppressions: {} }, null, 2));

  exec('knip --suppress-all --exports', { cwd });

  const after: Suppressions = JSON.parse(await read(cwd));
  assert(after.suppressions['module.ts']?.exports?.['unusedExport']);
  assert(!after.suppressions['package.json']);
  assert(!after.suppressions['unused.ts']);
});
