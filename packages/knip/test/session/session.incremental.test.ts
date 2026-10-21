import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import { SessionRebuildRequiredError } from '../../src/session/incremental.ts';
import { createPersistentSession, createSession, type Session } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const setup = async (t: TestContext) => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-incremental-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, 'package.json'), '{"name":"incremental","knip":{"entry":["index.ts"],"project":["*.ts"]}}');
  return cwd;
};

const assertFresh = async (session: Session, cwd: string) => {
  const fresh = await createSession(await createOptions({ cwd, isSession: true }));
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(session.getIssues(), fresh.getIssues());
  assert.deepEqual(session.getResults(), fresh.getResults());
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
});

test('namespace usage and dependency removal rebuild without retaining old edges or references', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"incremental","dependencies":{"left-pad":"1.0.0"},"knip":{"entry":["index.ts"],"project":["*.ts"]}}'
  );
  await writeFile(
    join(cwd, 'index.ts'),
    "import * as values from './value.ts'; import 'left-pad'; console.log(values.used);\n"
  );
  await writeFile(join(cwd, 'value.ts'), 'export const used = 1;\nexport const other = 2;\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  await writeFile(join(cwd, 'index.ts'), "import * as values from './value.ts'; console.log(values.other);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  await assertFresh(session, cwd);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['value.ts']), ['values.used']);
  assert.deepEqual(Object.keys(session.getIssues().issues.dependencies['package.json']), ['left-pad']);
});

test('cached sessions observe reported source changes with unchanged size and timestamps', async t => {
  const cwd = await setup(t);
  const filePath = join(cwd, 'value.ts');
  await writeFile(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value);\n");
  await writeFile(filePath, 'export const value = 1;\nexport const unused = 2;\n');
  await utimes(filePath, 1000, 1000);
  const before = await stat(filePath);
  const session = await createPersistentSession(() => createOptions({ cwd, args: { cache: true } }));
  await writeFile(filePath, 'export const value = 1;\nexport const spared = 2;\n');
  await utimes(filePath, before.atime, before.mtime);
  const after = await stat(filePath);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(after.size, before.size);
  await session.handleFileChanges([{ type: 'modified', filePath }]);
  await assertFresh(session, cwd);
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['value.ts']), ['spared']);
});

for (const isCache of [false, true]) {
  test(`added and deleted missing targets and entry files match fresh analysis (cache=${isCache})`, async t => {
    const cwd = await setup(t);
    await writeFile(join(cwd, 'index.ts'), "import { value } from './missing.ts'; console.log(value);\n");
    await writeFile(join(cwd, 'unused.ts'), 'export {};\n');
    const session = await createPersistentSession(() =>
      createOptions({ cwd, isSession: true, args: { cache: isCache } })
    );
    assert.deepEqual(Object.keys(session.getIssues().issues.unresolved['index.ts']), ['./missing.ts']);

    await writeFile(join(cwd, 'missing.ts'), 'export const value = 1;\nexport const unused = 2;\n');
    await session.handleFileChanges([{ type: 'added', filePath: 'missing.ts' }]);
    await assertFresh(session, cwd);
    assert.deepEqual(session.getIssues().issues.unresolved, {});

    await rm(join(cwd, 'missing.ts'));
    await session.handleFileChanges([{ type: 'deleted', filePath: 'missing.ts' }]);
    await assertFresh(session, cwd);
    assert.deepEqual(Object.keys(session.getIssues().issues.unresolved['index.ts']), ['./missing.ts']);

    await rm(join(cwd, 'index.ts'));
    await session.handleFileChanges([{ type: 'deleted', filePath: 'index.ts' }]);
    await assertFresh(session, cwd);
    await writeFile(join(cwd, 'index.ts'), "import './unused.ts';\n");
    await session.handleFileChanges([{ type: 'added', filePath: 'index.ts' }]);
    await assertFresh(session, cwd);
  });
}

test('persistent sessions reload JSON configuration, manifests and tsconfig aliases', async t => {
  const cwd = await setup(t);
  await writeFile(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["*.ts"]}');
  await writeFile(join(cwd, 'index.ts'), "import { value } from '@value'; console.log(value);\n");
  await writeFile(join(cwd, 'first.ts'), 'export const value = 1;\nexport const unused = 2;\n');
  await writeFile(join(cwd, 'second.ts'), 'export const value = 2;\n');
  await writeFile(join(cwd, 'tsconfig.json'), '{"compilerOptions":{"paths":{"@value":["./first.ts"]}}}');
  const session = await createPersistentSession(() => createOptions({ cwd, isSession: true }));

  await writeFile(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["*.ts"],"ignore":["second.ts"]}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'knip.json' }]);
  await assertFresh(session, cwd);
  assert.deepEqual(session.getIssues().issues.files, {});

  await writeFile(join(cwd, 'package.json'), '{"name":"incremental","dependencies":{"left-pad":"1.0.0"}}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'package.json' }]);
  await assertFresh(session, cwd);
  assert.deepEqual(Object.keys(session.getIssues().issues.dependencies['package.json']), ['left-pad']);

  await writeFile(join(cwd, 'tsconfig.json'), '{"compilerOptions":{"paths":{"@value":["./second.ts"]}}}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'tsconfig.json' }]);
  await assertFresh(session, cwd);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['first.ts']);
});

test('existing sessions expose configuration rebuilds and executable configuration requires restart', async t => {
  const cwd = await setup(t);
  await writeFile(join(cwd, 'index.ts'), 'export {};\n');
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  await writeFile(join(cwd, 'knip.json'), '{"entry":["different.ts"]}');
  await assert.rejects(
    session.handleFileChanges([{ type: 'added', filePath: 'knip.json' }]),
    error => error instanceof SessionRebuildRequiredError && error.reason === 'configuration'
  );

  await rm(join(cwd, 'knip.json'));
  await writeFile(
    join(cwd, 'knip.ts'),
    "import { entry } from './settings.ts'; export default { entry, project: ['*.ts'] };\n"
  );
  await writeFile(join(cwd, 'settings.ts'), "export const entry = ['index.ts'];\n");
  const persistent = await createPersistentSession(() => createOptions({ cwd, isSession: true }));
  await writeFile(join(cwd, 'settings.ts'), "export const entry = ['different.ts'];\n");
  await assert.rejects(
    persistent.handleFileChanges([{ type: 'modified', filePath: 'settings.ts' }]),
    error => error instanceof SessionRebuildRequiredError && error.reason === 'restart'
  );
});
