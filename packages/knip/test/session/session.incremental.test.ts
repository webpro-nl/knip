import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import test, { type TestContext } from 'node:test';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import { createSession, type Session } from '../../src/session/session.ts';
import type { MainOptions } from '../../src/util/create-options.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

const setup = async (t: TestContext, fixture = 'session-incremental') => {
  const cwd = await copyFixture(`fixtures/${fixture}`);
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
};

const assertFresh = async (session: Session, options: MainOptions, isOrdered = true) => {
  const fresh = await createSession(await createOptions(options.createdFrom));
  if (isOrdered) assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(session.getIssues(), fresh.getIssues());
  assert.deepEqual(session.describePackageJson(), fresh.describePackageJson());
};

test('body edits retain reachability and match fresh ordered issues and counters', async t => {
  const cwd = await setup(t);
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const walk = t.mock.method(ProjectPrincipal.prototype, 'getUsedResolvedFiles');
  const rebuild = t.mock.method(ProjectPrincipal.prototype, 'walkAndAnalyze');

  await writeFile(join(cwd, 'value.ts'), 'export const value = 123;\nexport const originalUnused = 2;\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]);
  assert.equal(rebuild.mock.callCount(), 0);
  await assertFresh(session, options);
  assert.equal(walk.mock.callCount(), 0);
  assert.equal(await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]), undefined);
  const rebuilds = rebuild.mock.callCount();
  await writeFile(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value, value);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.equal(rebuild.mock.callCount(), rebuilds);
  await assertFresh(session, options);
  assert.equal(walk.mock.callCount(), 0);
  const descriptor = session.describeFile(join(cwd, 'value.ts'));
  const beforeShift = rebuild.mock.callCount();
  await writeFile(join(cwd, 'index.ts'), "\nimport { value } from './value.ts'; console.log(value, value);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.equal(rebuild.mock.callCount(), beforeShift);
  const shifted = session.describeFile(join(cwd, 'value.ts'));
  assert.ok(descriptor && shifted);
  assert.equal(shifted.exports[0].importLocations[0].line, descriptor.exports[0].importLocations[0].line + 1);
  await assertFresh(session, options);
});

test('namespace usage changes invalidate cached references', async t => {
  const cwd = await setup(t, 'namespaces/namespace-enumerated');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.deepEqual(session.getIssues().issues.exports, {});
  await writeFile(join(cwd, 'index.ts'), "import * as palette from './colors.ts'; console.log(palette.red);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  await assertFresh(session, options);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['colors.ts']).sort(), [
    'palette.blue',
    'palette.green',
  ]);
  await writeFile(join(cwd, 'index.ts'), "import * as palette from './colors.ts'; console.log(palette.green);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  await assertFresh(session, options);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['colors.ts']).sort(), [
    'palette.blue',
    'palette.red',
  ]);
});

test('package script issues survive incremental and topology-changing edits', async t => {
  const cwd = await setup(t);
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.deepEqual(Object.keys(session.getIssues().issues.binaries['package.json']), ['missing-command']);

  await writeFile(join(cwd, 'value.ts'), 'export const value = 2;\nexport const originalUnused = 2;\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]);
  await assertFresh(session, options);
  assert.deepEqual(Object.keys(session.getIssues().issues.binaries['package.json']), ['missing-command']);

  await writeFile(join(cwd, 'value.ts'), 'export const value = 3;\nexport const unused = 4;\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]);
  await assertFresh(session, options);
  assert.deepEqual(Object.keys(session.getIssues().issues.binaries['package.json']), ['missing-command']);
});

test('subpath references released by edits and deletions refresh unused subpaths', async t => {
  const cwd = await setup(t, 'session-subpaths');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#unused']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['unused.ts']);
  assert.deepEqual(session.getIssues().issues.exports, {});

  await writeFile(join(cwd, 'index.ts'), "import { unused } from '#unused'; console.log(unused);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(session.getIssues().issues.subpaths, {});
  assert.deepEqual(session.getIssues().issues.files, {});
  assert.deepEqual(session.getIssues().issues.exports, {});
  await assertFresh(session, options);

  await writeFile(join(cwd, 'other.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'other.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#used']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['used.ts']);
  await assertFresh(session, options);

  await rm(join(cwd, 'index.ts'));
  await session.handleFileChanges([{ type: 'deleted', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), ['#unused', '#used']);
});

test('files matched by a subpath import pattern keep their unused exports after topology changes', async t => {
  const cwd = await setup(t, 'session-subpath-patterns');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['used.ts']), ['spare']);

  await writeFile(
    join(cwd, 'consumer.ts'),
    "import { used } from '#/used.ts';\nimport { other } from '#/other.ts';\nexport const consumer = [used, other];\n"
  );
  await session.handleFileChanges([{ type: 'modified', filePath: 'consumer.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports).sort(), ['other.ts', 'used.ts']);
  await assertFresh(session, options);
});

test('files matched by a subpath import pattern keep their unused exports while the importing file is unchanged', async t => {
  const cwd = await setup(t, 'session-subpath-patterns');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports), ['used.ts']);

  await writeFile(
    join(cwd, 'index.ts'),
    "import { consumer } from './consumer.ts';\nimport { other, extra } from './other.ts';\nconsole.log(consumer, other, extra);\n"
  );
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports), ['used.ts']);
  await assertFresh(session, options);
});

test('workspace package subpath targets stay entry files after unrelated topology changes', async t => {
  const cwd = await setup(t, 'session-subpath-workspaces');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.deepEqual(session.getIssues().issues.exports, {});

  await writeFile(
    join(cwd, 'packages/app/index.ts'),
    "import { consumer } from './consumer.ts';\nimport { other } from './other.ts';\nconsole.log(consumer, other);\n"
  );
  await session.handleFileChanges([{ type: 'modified', filePath: 'packages/app/index.ts' }]);
  assert.deepEqual(session.getIssues().issues.exports, {});
  await assertFresh(session, options);
});

test('subpath targets stay entry files while a script references them', async t => {
  const cwd = await setup(t, 'session-subpaths');
  const options = await createOptions({ cwd, isSession: true, args: { config: 'knip.script.json' } });
  const session = await createSession(options);
  assert.deepEqual(session.getIssues().issues.files, {});

  await writeFile(join(cwd, 'index.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), [
    '#setup',
    '#unused',
    '#used',
  ]);
  assert.deepEqual(session.getIssues().issues.files, {});
  await assertFresh(session, options);
});

test('subpath references of files that leave the graph are released', async t => {
  const cwd = await setup(t, 'session-subpaths');
  const options = await createOptions({ cwd, isSession: true, args: { config: 'knip.chain.json' } });
  const session = await createSession(options);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), ['#setup', '#unused']);
  assert.deepEqual(session.getIssues().issues.files, {});

  await writeFile(join(cwd, 'chain.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'chain.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), [
    '#setup',
    '#unused',
    '#used',
  ]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['last.ts', 'used.ts']);
  await assertFresh(session, options, false);
});

test('subpath references from files outside the project are collected in sessions', async t => {
  const cwd = await setup(t, 'session-subpaths');
  const options = await createOptions({ cwd, isSession: true, args: { config: 'knip.bridge.json' } });
  const session = await createSession(options);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), [
    '#setup',
    '#unused',
    '#used',
  ]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['used.ts']);

  await writeFile(join(cwd, 'unused.ts'), "import './bridge/index.js';\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'unused.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), ['#setup', '#unused']);
  assert.deepEqual(session.getIssues().issues.files, {});
  await assertFresh(session, options);

  await writeFile(join(cwd, 'unused.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'unused.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), [
    '#setup',
    '#unused',
    '#used',
  ]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['used.ts']);
  await assertFresh(session, options);
});

test('subpath references from scripts in modified files are refreshed', async t => {
  const cwd = await setup(t, 'session-subpaths');
  const options = await createOptions({ cwd, isSession: true, args: { config: 'knip.preload.json' } });
  const session = await createSession(options);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), ['#unused', '#used']);
  assert.deepEqual(session.getIssues().issues.files, {});

  await writeFile(join(cwd, 'preload.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'preload.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), [
    '#setup',
    '#unused',
    '#used',
  ]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['setup-default.ts']);
});
