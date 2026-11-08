import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import { createSession, type Session } from '../../src/session/session.ts';
import { join, toPosix } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const setup = async (t: TestContext) => {
  const cwd = toPosix(await realpath(await mkdtemp(join(tmpdir(), 'knip-session-incremental-'))));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, 'package.json'), '{"name":"incremental","knip":{"entry":["index.ts"],"project":["*.ts"]}}');
  return cwd;
};

const assertFresh = async (session: Session, cwd: string, isOrdered = true) => {
  const fresh = await createSession(await createOptions({ cwd, isSession: true }));
  if (isOrdered) assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(session.getIssues(), fresh.getIssues());
  assert.deepEqual(session.describePackageJson(), fresh.describePackageJson());
};

test('body edits retain reachability and match fresh ordered issues and counters', async t => {
  const cwd = await setup(t);
  await writeFile(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value);\n");
  await writeFile(join(cwd, 'value.ts'), 'export const value = 1;\nexport const unused = 2;\n');
  await writeFile(join(cwd, 'unused.ts'), 'export {};\n');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const walk = t.mock.method(ProjectPrincipal.prototype, 'getUsedResolvedFiles');
  const rebuild = t.mock.method(ProjectPrincipal.prototype, 'walkAndAnalyze');

  await writeFile(join(cwd, 'value.ts'), 'export const value = 123;\nexport const unused = 2;\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]);
  assert.equal(rebuild.mock.callCount(), 0);
  await assertFresh(session, cwd);
  assert.equal(walk.mock.callCount(), 0);
  assert.equal(await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]), undefined);
  const rebuilds = rebuild.mock.callCount();
  await writeFile(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value, value);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.equal(rebuild.mock.callCount(), rebuilds);
  await assertFresh(session, cwd);
  assert.equal(walk.mock.callCount(), 0);
  const descriptor = session.describeFile(join(cwd, 'value.ts'));
  const beforeShift = rebuild.mock.callCount();
  await writeFile(join(cwd, 'index.ts'), "\nimport { value } from './value.ts'; console.log(value, value);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.equal(rebuild.mock.callCount(), beforeShift);
  const shifted = session.describeFile(join(cwd, 'value.ts'));
  assert.ok(descriptor && shifted);
  assert.equal(shifted.exports[0].importLocations[0].line, descriptor.exports[0].importLocations[0].line + 1);
  await assertFresh(session, cwd);
});

test('namespace usage changes invalidate cached references', async t => {
  const cwd = await setup(t);
  await writeFile(join(cwd, 'index.ts'), "import * as values from './value.ts'; console.log(values.used);\n");
  await writeFile(join(cwd, 'value.ts'), 'export const used = 1;\nexport const other = 2;\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  await writeFile(join(cwd, 'index.ts'), "import * as values from './value.ts'; console.log(values.other);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  await assertFresh(session, cwd);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['value.ts']), ['values.used']);
});

test('package script issues survive incremental and topology-changing edits', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"incremental","scripts":{"check":"missing-script-bin"},"knip":{"entry":["index.ts"],"project":["*.ts"]}}'
  );
  await writeFile(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value);\n");
  await writeFile(join(cwd, 'value.ts'), 'export const value = 1;\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  assert.deepEqual(Object.keys(session.getIssues().issues.binaries['package.json']), ['missing-script-bin']);

  await writeFile(join(cwd, 'value.ts'), 'export const value = 2;\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]);
  await assertFresh(session, cwd);
  assert.deepEqual(Object.keys(session.getIssues().issues.binaries['package.json']), ['missing-script-bin']);

  await writeFile(join(cwd, 'value.ts'), 'export const value = 3;\nexport const unused = 4;\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'value.ts' }]);
  await assertFresh(session, cwd);
  assert.deepEqual(Object.keys(session.getIssues().issues.binaries['package.json']), ['missing-script-bin']);
});

test('subpath references released by edits and deletions refresh unused subpaths', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"incremental","devDependencies":{"jest":"*"},"imports":{"#used":"./used.ts","#unused":"./unused.ts","#setup":"./setup.ts"},"knip":{"entry":["index.ts","other.ts"],"project":["*.ts"]}}'
  );
  await writeFile(join(cwd, 'jest.config.ts'), "export default { setupFiles: ['#setup'] };\n");
  await writeFile(join(cwd, 'setup.ts'), 'export {};\n');
  await writeFile(join(cwd, 'index.ts'), "import { used } from '#used'; console.log(used);\n");
  await writeFile(
    join(cwd, 'other.ts'),
    "import pkg from './package.json';\nimport { used } from '#used'; console.log(pkg, used);\n"
  );
  await writeFile(join(cwd, 'used.ts'), 'export const used = 1;\nexport const spare = 2;\n');
  await writeFile(join(cwd, 'unused.ts'), 'export const unused = 3;\nexport const extra = 4;\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#unused']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['unused.ts']);
  assert.deepEqual(session.getIssues().issues.exports, {});

  await writeFile(join(cwd, 'index.ts'), "import { unused } from '#unused'; console.log(unused);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(session.getIssues().issues.subpaths, {});
  assert.deepEqual(session.getIssues().issues.files, {});
  assert.deepEqual(session.getIssues().issues.exports, {});
  await assertFresh(session, cwd);

  await writeFile(join(cwd, 'other.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'other.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#used']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['used.ts']);
  await assertFresh(session, cwd);

  await rm(join(cwd, 'index.ts'));
  await session.handleFileChanges([{ type: 'deleted', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']).sort(), ['#unused', '#used']);
});

test('subpath targets stay entry files while a script references them', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"incremental","imports":{"#used":"./used.ts"},"knip":{"entry":["index.ts","run.ts"],"project":["*.ts"]}}'
  );
  await writeFile(join(cwd, 'index.ts'), "import { used } from '#used'; console.log(used);\n");
  await writeFile(join(cwd, 'run.ts'), "import { execSync } from 'node:child_process';\nexecSync('node used.ts');\n");
  await writeFile(join(cwd, 'used.ts'), 'export const used = 1;\nexport const spare = 2;\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  assert.deepEqual(session.getIssues().issues.files, {});

  await writeFile(join(cwd, 'index.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#used']);
  assert.deepEqual(session.getIssues().issues.files, {});
  await assertFresh(session, cwd);
});

test('subpath references of files that leave the graph are released', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"incremental","imports":{"#used":"./used.ts"},"knip":{"entry":["index.ts"],"project":["*.ts"]}}'
  );
  await writeFile(join(cwd, 'index.ts'), "import { last } from './last.ts'; console.log(last);\n");
  await writeFile(join(cwd, 'last.ts'), "import { used } from '#used'; export const last = used;\n");
  await writeFile(join(cwd, 'used.ts'), 'export const used = 1;\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  assert.deepEqual(session.getIssues().issues.subpaths, {});
  assert.deepEqual(session.getIssues().issues.files, {});

  await writeFile(join(cwd, 'index.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#used']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['last.ts', 'used.ts']);
  await assertFresh(session, cwd, false);
});

test('subpath references from files outside the project are collected in sessions', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"incremental","imports":{"#via-bridge":"./via.ts"},"knip":{"entry":["index.ts"],"project":["*.ts"]}}'
  );
  await mkdir(join(cwd, 'bridge'));
  await writeFile(join(cwd, 'bridge/index.js'), "import '#via-bridge';\n");
  await writeFile(join(cwd, 'via.ts'), 'export const via = 1;\n');
  await writeFile(join(cwd, 'index.ts'), 'console.log(1);\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#via-bridge']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['via.ts']);

  await writeFile(join(cwd, 'index.ts'), "import './bridge/index.js';\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(session.getIssues().issues.subpaths, {});
  assert.deepEqual(session.getIssues().issues.files, {});
  await assertFresh(session, cwd);

  await writeFile(join(cwd, 'index.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#via-bridge']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['via.ts']);
  await assertFresh(session, cwd);
});

test('subpath references from scripts in modified files are refreshed', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"incremental","imports":{"#setup":{"node":"./setup-node.ts","default":"./setup-default.ts"}},"knip":{"entry":["index.ts"],"project":["*.ts"]}}'
  );
  await writeFile(
    join(cwd, 'index.ts'),
    "import { execSync } from 'node:child_process';\nexecSync('node --import=#setup index.ts');\n"
  );
  await writeFile(join(cwd, 'setup-node.ts'), 'export {};\n');
  await writeFile(join(cwd, 'setup-default.ts'), 'export {};\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  assert.deepEqual(session.getIssues().issues.subpaths, {});
  assert.deepEqual(session.getIssues().issues.files, {});

  await writeFile(join(cwd, 'index.ts'), 'console.log(1);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.subpaths['package.json']), ['#setup']);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['setup-default.ts']);
});
