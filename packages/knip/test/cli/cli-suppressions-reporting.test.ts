import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import test from 'node:test';
import type { JSONReport } from '../../src/reporters/json.ts';
import type { Suppressions } from '../../src/types/suppressions.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { exec } from '../helpers/exec.ts';

const write = (cwd: string, suppressions: Suppressions['suppressions']) =>
  writeFile(join(cwd, '.knip-suppressions.json'), JSON.stringify({ version: 1, suppressions }, null, 2));

test('JSON reporter reports suppressed issues separately from live ones', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    'module.ts': { exports: { unusedExport: {} } },
    'package.json': { dependencies: { 'unused-pkg': {} } },
  });

  const report: JSONReport = JSON.parse(exec('knip --reporter json', { cwd }).stdout);

  const live = report.issues.find(entry => entry.file === 'module.ts');
  assert.deepEqual(live?.exports?.map(item => item.name), ['anotherUnused']);

  const suppressed = report.suppressed.find(entry => entry.file === 'module.ts');
  assert.deepEqual(suppressed?.exports?.map(item => item.name), ['unusedExport']);

  const suppressedDeps = report.suppressed.find(entry => entry.file === 'package.json');
  assert.deepEqual(suppressedDeps?.dependencies?.map(item => item.name), ['unused-pkg']);
});

test('JSON reporter keeps positions on suppressed issues', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, { 'module.ts': { exports: { unusedExport: {} } } });

  const report: JSONReport = JSON.parse(exec('knip --reporter json', { cwd }).stdout);
  const item = report.suppressed.find(entry => entry.file === 'module.ts')?.exports?.[0];

  assert.equal(item?.name, 'unusedExport');
  assert.equal(typeof item?.line, 'number');
  assert.equal(typeof item?.col, 'number');
});

test('JSON reporter reports an empty suppressed list when there is no suppressions file', async () => {
  const cwd = await copyFixture('fixtures/suppressions-workspaces');

  const report: JSONReport = JSON.parse(exec('knip --reporter json', { cwd }).stdout);

  assert.deepEqual(report.suppressed, []);
  assert(report.issues.length > 0);
});

test('Suppressed count is reported without a TTY, so CI can see it', async () => {
  const cwd = await copyFixture('fixtures/suppressions');

  const { stdout } = exec('knip', { cwd });

  assert.match(stdout, /5 suppressed/);
});

test('Expired suppressions are counted alongside suppressed ones', async () => {
  const cwd = await copyFixture('fixtures/suppressions');
  await write(cwd, {
    'module.ts': { exports: { unusedExport: {}, anotherUnused: { until: '2020-01-01' } } },
  });

  const { stdout } = exec('knip', { cwd });

  assert.match(stdout, /1 suppressed, 1 expired/);
});
