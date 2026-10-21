import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { createPersistentSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('plugin entry files remain editable without being treated as executable configuration', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-plugin-entry-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({
      name: 'plugin-entry',
      devDependencies: { vitest: '*' },
      knip: { entry: ['index.ts'], project: ['*.ts'] },
    })
  );
  await writeFile(join(cwd, 'index.ts'), 'export {};\n');
  await writeFile(join(cwd, 'value.ts'), 'export const used = 1; export const unused = 2;\n');
  await writeFile(join(cwd, 'value.test.ts'), "import { used } from './value.ts'; console.log(used);\n");
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createPersistentSession(loadOptions);
  await writeFile(join(cwd, 'value.test.ts'), "import { unused } from './value.ts'; console.log(unused);\n");
  await session.handleFileChanges([{ type: 'modified', filePath: 'value.test.ts' }]);
  const fresh = await createPersistentSession(loadOptions);
  assert.deepEqual(session.getIssues(), fresh.getIssues());
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
  assert.deepEqual(Object.keys(session.getIssues().issues.exports['value.ts']), ['used']);
});

test('data imported by executable configuration requires a process restart', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-config-data-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, 'package.json'), '{"name":"config-data"}');
  await writeFile(join(cwd, 'settings.json'), '{"entry":["index.ts"]}');
  await writeFile(
    join(cwd, 'knip.ts'),
    "import settings from './settings.json'; export default { entry: settings.entry, project: ['*.ts'] };\n"
  );
  await writeFile(join(cwd, 'index.ts'), 'export {};\n');
  await writeFile(join(cwd, 'other.ts'), 'export {};\n');
  const session = await createPersistentSession(() => createOptions({ cwd, isSession: true }));
  await writeFile(join(cwd, 'settings.json'), '{"entry":["other.ts"]}');
  await assert.rejects(
    session.handleFileChanges([{ type: 'modified', filePath: 'settings.json' }]),
    /restart.*new process/
  );
});

test('body edits retain package script findings and match a fresh session', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-script-issues-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({ name: 'script-issues', scripts: { build: 'missing-command' }, knip: { entry: ['index.ts'] } })
  );
  await writeFile(join(cwd, 'index.ts'), 'console.log(1);\n');
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createPersistentSession(loadOptions);
  assert.deepEqual(Object.keys(session.getIssues().issues.binaries['package.json']), ['missing-command']);
  await writeFile(join(cwd, 'index.ts'), 'console.log(123);\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'index.ts' }]);
  const fresh = await createPersistentSession(loadOptions);
  assert.deepEqual(session.getIssues(), fresh.getIssues());
  assert.equal(JSON.stringify(session.getIssues()), JSON.stringify(fresh.getIssues()));
});

test('restart requirements dominate a complete change batch and remain latched', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-config-batch-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, 'package.json'), '{"name":"config-batch"}');
  await writeFile(join(cwd, 'settings.json'), '{"entry":["index.ts"]}');
  await writeFile(join(cwd, 'knip.ts'), "import settings from './settings.json'; export default settings;\n");
  await writeFile(join(cwd, 'index.ts'), 'export {};\n');
  const session = await createPersistentSession(() => createOptions({ cwd, isSession: true }));
  await writeFile(join(cwd, 'settings.json'), '{"entry":[]}');
  await writeFile(join(cwd, 'package.json'), '{"name":"changed"}');
  await assert.rejects(
    session.handleFileChanges([
      { type: 'modified', filePath: 'package.json' },
      { type: 'modified', filePath: 'settings.json' },
    ]),
    /restart.*new process/
  );
  await assert.rejects(
    session.handleFileChanges([{ type: 'modified', filePath: 'package.json' }]),
    /restart.*new process/
  );
});

test('cached persistent sessions discover newly created gitignore files', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-new-gitignore-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"new-gitignore","knip":{"entry":["index.ts"],"project":["*.ts"]}}'
  );
  await writeFile(join(cwd, 'index.ts'), 'export {};\n');
  await writeFile(join(cwd, 'unused.ts'), 'export {};\n');
  const session = await createPersistentSession(() => createOptions({ cwd, args: { cache: true } }));
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['unused.ts']);
  await writeFile(join(cwd, '.gitignore'), 'unused.ts\n');
  await session.handleFileChanges([{ type: 'added', filePath: '.gitignore' }]);
  assert.deepEqual(session.getIssues().issues.files, {});
  const restored = await createPersistentSession(() => createOptions({ cwd, args: { cache: true } }));
  assert.deepEqual(restored.getIssues().issues.files, {});
});

test('restart tracking follows configuration imports outside the project glob', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-config-outside-project-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(join(cwd, 'config'));
  await mkdir(join(cwd, 'src'));
  await writeFile(join(cwd, 'package.json'), '{"name":"config-outside-project"}');
  await writeFile(join(cwd, 'config/settings.json'), '{"entry":["src/index.ts"]}');
  await writeFile(
    join(cwd, 'config/helper.ts'),
    "import settings from './settings.json'; export const entry = settings.entry;\n"
  );
  await writeFile(
    join(cwd, 'knip.ts'),
    "import { entry } from './config/helper.ts'; export default { entry, project: ['src/**/*.ts'] };\n"
  );
  await writeFile(join(cwd, 'src/index.ts'), 'export {};\n');
  const session = await createPersistentSession(() => createOptions({ cwd, isSession: true }));
  await writeFile(join(cwd, 'config/settings.json'), '{"entry":[]}');
  await assert.rejects(
    session.handleFileChanges([{ type: 'modified', filePath: 'config/settings.json' }]),
    /restart.*new process/
  );
});
