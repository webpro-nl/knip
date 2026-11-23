import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { main } from '../../src/index.ts';
import { toEntry } from '../../src/util/input.ts';
import { join } from '../../src/util/path.ts';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/plugin-entry-workspace-overrides');

const run = async (
  t: TestContext,
  ignoreWorkspaces: string[],
  specifier?: string,
  dir = 'packages/app/nested/ignored',
  skipExportsAnalysis = false,
  fixtureCwd = cwd
) => {
  const inputs = specifier
    ? [
        { ...toEntry(specifier), dir: join(fixtureCwd, dir), group: 'jest', skipExportsAnalysis },
        { ...toEntry('**/test/*.ts'), group: 'jest', skipExportsAnalysis },
      ]
    : [];
  const runPlugins = t.mock.method(WorkspaceWorker.prototype, 'runPlugins', async function (this: WorkspaceWorker) {
    return this.name === '.' ? inputs : [];
  });
  try {
    const options = await createOptions({ cwd: fixtureCwd });
    options.parsedConfig.ignoreWorkspaces = ignoreWorkspaces;
    return await main(options);
  } finally {
    runPlugins.mock.restore();
  }
};

const assertIgnored = async (
  t: TestContext,
  ignoreWorkspaces: string[],
  specifier: string,
  dir: string,
  skipExportsAnalysis: boolean
) => {
  const baseline = await run(t, ignoreWorkspaces);
  const actual = await run(t, ignoreWorkspaces, specifier, dir, skipExportsAnalysis);
  assert.ok(baseline.issues.files['keep.ts']);
  assert.ok(actual.issues.files['keep.ts'], 'An ignored plugin entry must not make its import look used');
  assert.deepEqual(Object.keys(actual.issues.files).sort(), Object.keys(baseline.issues.files).sort());
  assert.deepEqual(actual.counters, baseline.counters);
};

for (const skipExportsAnalysis of [false, true]) {
  test(`Keep nested workspace ignored after restoring its parent (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(
      t,
      ['packages/*', '!packages/app', 'packages/app/nested/*'],
      'keep.ts',
      'packages/app/nested/ignored',
      skipExportsAnalysis
    );
  });

  test(`Keep exact nested workspace ignored after restoring its parent (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(
      t,
      ['packages/*', '!packages/app', 'packages/app/nested/ignored'],
      'keep.ts',
      'packages/app/nested/ignored',
      skipExportsAnalysis
    );
  });

  test(`Workspace overrides retain partitioned rather than last-rule-wins semantics (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(
      t,
      ['packages/app/nested/*', '!packages/app', 'packages/*', '!packages/app', 'packages/app/nested/*'],
      'keep.ts',
      'packages/app/nested/ignored',
      skipExportsAnalysis
    );
  });

  test(`Keep ignored sibling dotfile out of plugin entries (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(t, ['packages/*', '!packages/app'], '.hidden.ts', 'packages/ignored', skipExportsAnalysis);
  });

  test(`Keep ignored sibling hidden directory out of plugin entries (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(
      t,
      ['packages/*', '!packages/app'],
      'hidden.ts',
      'packages/ignored/.hidden-dir',
      skipExportsAnalysis
    );
  });

  test(`Workspace boundaries do not enable a sibling sharing the restored prefix (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(t, ['packages/*', '!packages/app'], 'keep.ts', 'packages/app2', skipExportsAnalysis);
  });

  test(`Preserve manifest-excluded workspace pruning with overrides (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(t, ['packages/*', '!packages/app'], 'keep.ts', 'packages/excluded', skipExportsAnalysis);
  });

  test(`Accept dotfile in a restored workspace (skip exports: ${skipExportsAnalysis})`, async t => {
    const { issues } = await run(t, ['packages/*', '!packages/app'], '.hidden.ts', 'packages/app', skipExportsAnalysis);
    assert.equal(issues.files['keep.ts'], undefined);
    assert.equal(issues.files['packages/app/.hidden.ts'], undefined);
  });

  test(`Accept hidden directory in a restored workspace (skip exports: ${skipExportsAnalysis})`, async t => {
    const { issues } = await run(
      t,
      ['packages/*', '!packages/app'],
      'hidden.ts',
      'packages/app/.hidden-dir',
      skipExportsAnalysis
    );
    assert.equal(issues.files['keep.ts'], undefined);
    assert.equal(issues.files['packages/app/.hidden-dir/hidden.ts'], undefined);
  });

  test(`Explicitly restore a nested workspace even when its parent is ignored (skip exports: ${skipExportsAnalysis})`, async t => {
    const { issues } = await run(
      t,
      ['packages/*', 'packages/app/nested/*', '!packages/app/nested/ignored'],
      'keep.ts',
      'packages/app/nested/ignored',
      skipExportsAnalysis
    );
    assert.equal(issues.files['keep.ts'], undefined);
    assert.equal(issues.files['packages/app/nested/ignored/keep.ts'], undefined);
  });

  test(`Restoring a nested workspace does not restore its ignored parent (skip exports: ${skipExportsAnalysis})`, async t => {
    await assertIgnored(
      t,
      ['packages/*', 'packages/app/nested/*', '!packages/app/nested/ignored'],
      '.hidden.ts',
      'packages/app',
      skipExportsAnalysis
    );
  });

  test(`A repeated ignore does not cancel an exact workspace exception (skip exports: ${skipExportsAnalysis})`, async t => {
    const { issues } = await run(
      t,
      ['!packages/app', 'packages/*', 'packages/app', '!packages/app', 'packages/app'],
      '.hidden.ts',
      'packages/app',
      skipExportsAnalysis
    );
    assert.equal(issues.files['keep.ts'], undefined);
    assert.equal(issues.files['packages/app/.hidden.ts'], undefined);
  });
}

test('Retain safe ignored-workspace pruning while restoring another workspace', async t => {
  const batches = t.mock.method(WorkspaceWorker.prototype, 'getPluginEntryFilePatterns');
  try {
    await assertIgnored(
      t,
      ['packages/*', '!packages/app', 'packages/app/nested/*'],
      'keep.ts',
      'packages/app/nested/ignored',
      false
    );
    assert.ok(batches.mock.calls.some(call => call.result?.flat().includes('!packages/ignored/**')));
    assert.ok(batches.mock.calls.some(call => call.result?.flat().includes('!packages/app/nested/ignored/**')));
  } finally {
    batches.mock.restore();
  }
});

for (const skipExportsAnalysis of [false, true]) {
  test(`Do not restore a manifest-excluded parent of an available child (skip exports: ${skipExportsAnalysis})`, async t => {
    const fixtureCwd = resolve('fixtures/plugin-config/plugin-entry-workspace-overrides-manifest-parent');
    const { issues } = await run(
      t,
      ['packages/*', '!packages/parent/nested/child'],
      '.hidden.ts',
      'packages/parent',
      skipExportsAnalysis,
      fixtureCwd
    );
    assert.ok(issues.files['keep.ts'], 'A manifest-excluded parent entry must not hide its unused import');
  });

  test(`Do not prune an available child beneath a manifest-excluded parent (skip exports: ${skipExportsAnalysis})`, async t => {
    const fixtureCwd = resolve('fixtures/plugin-config/plugin-entry-workspace-overrides-manifest-parent');
    const { issues } = await run(
      t,
      ['packages/*', '!packages/parent/nested/child'],
      'keep.ts',
      'packages/parent/nested/child',
      skipExportsAnalysis,
      fixtureCwd
    );
    assert.equal(issues.files['keep.ts'], undefined);
    assert.equal(issues.files['packages/parent/nested/child/keep.ts'], undefined);
  });
}
