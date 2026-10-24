import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
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

const assertFresh = async (session: Session, cwd: string) => {
  const fresh = await createSession(await createOptions({ cwd, isSession: true }));
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
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
