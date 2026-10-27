import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const setup = async (t: TestContext, prefix = 'knip-session-configuration-') => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), prefix)));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(join(cwd, 'src'));
  await writeFile(join(cwd, 'package.json'), '{"name":"configuration","devDependencies":{"vite":"*"}}');
  await writeFile(join(cwd, 'knip.json'), '{"entry":["src/index.ts"],"project":["src/**/*.ts"]}');
  await writeFile(join(cwd, 'src/index.ts'), 'export {};\n');
  await writeFile(join(cwd, 'src/first.ts'), 'export {};\n');
  await writeFile(join(cwd, 'src/second.ts'), 'export {};\n');
  return cwd;
};

test('JSON configuration reloads options and refreshes the existing results object', async t => {
  const cwd = await setup(t);
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createSession(await loadOptions());
  const results = session.getResults();
  await writeFile(join(cwd, 'knip.json'), '{"entry":["src/*.ts"],"project":["src/**/*.ts"]}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'knip.json' }]);
  const fresh = await createSession(await loadOptions());
  assert.deepEqual(session.getIssues(), fresh.getIssues());
  assert.deepEqual(session.getResults(), fresh.getResults());
  assert.equal(session.getResults(), results);
});

test('a workspace own plugin JSON configuration reloads without restarting the process', async t => {
  const cwd = await setup(t);
  await writeFile(
    join(cwd, 'knip.json'),
    '{"entry":["src/index.ts"],"project":["src/**/*.ts"],"vite":{"config":["vite.settings.json"]}}'
  );
  await writeFile(join(cwd, 'vite.settings.json'), '{"test":{"include":["src/first.ts"]}}');
  const loadOptions = () => createOptions({ cwd, isSession: true, args: { cache: true } });
  const session = await createSession(await loadOptions());
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
  await writeFile(join(cwd, 'vite.settings.json'), '{"test":{"include":["src/second.ts"]}}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'vite.settings.json' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/first.ts']);
});

for (const changedFile of ['vite.config.ts', 'config/settings.json']) {
  test(`workspace plugin configuration reloads when ${changedFile} changes`, async t => {
    const cwd = await setup(t);
    await mkdir(join(cwd, 'config'));
    await writeFile(join(cwd, 'config/settings.json'), '{"include":["src/first.ts"]}');
    await writeFile(
      join(cwd, 'vite.config.ts'),
      "import settings from './config/settings.json'; export default { test: settings };\n"
    );
    const loadOptions = () => createOptions({ cwd, isSession: true });
    const session = await createSession(await loadOptions());
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
    await writeFile(
      join(cwd, changedFile),
      changedFile.endsWith('.json')
        ? '{"include":["src/second.ts"]}'
        : "export default { test: { include: ['src/second.ts'] } };\n"
    );
    await session.handleFileChanges([{ type: 'modified', filePath: changedFile }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/first.ts']);
  });
}

test('new plugin configs are discovered using the enabled plugin configuration patterns', async t => {
  const cwd = await setup(t);
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createSession(await loadOptions());
  await writeFile(join(cwd, 'vite.config.ts'), "export default { test: { include: ['src/first.ts'] } };\n");
  await session.handleFileChanges([{ type: 'added', filePath: 'vite.config.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
});

test('unrelated config basenames and plugin entry files do not reload options', async t => {
  const cwd = await setup(t);
  await mkdir(join(cwd, 'unrelated'));
  const session = await createSession(await createOptions({ cwd, isSession: true }));
  assert.deepEqual(Object.keys(session.getIssues().issues.files).sort(), ['src/first.ts', 'src/second.ts']);
  // A silent config edit only takes effect when the session reloads its options
  await writeFile(
    join(cwd, 'knip.json'),
    '{"entry":["src/index.ts"],"project":["src/**/*.ts"],"ignore":["src/first.ts"]}'
  );
  await writeFile(join(cwd, 'unrelated/vite.config.ts'), 'export {};\n');
  await writeFile(join(cwd, 'unrelated/package.json'), '{}');
  await session.handleFileChanges([
    { type: 'added', filePath: 'unrelated/vite.config.ts' },
    { type: 'added', filePath: 'unrelated/package.json' },
  ]);
  assert.ok(session.getIssues().issues.files['src/first.ts']);
  await session.handleFileChanges([{ type: 'modified', filePath: 'knip.json' }]);
  assert.equal(session.getIssues().issues.files['src/first.ts'], undefined);
});

test('a child workspace own plugin config reloads when an imported helper changes', async t => {
  const cwd = await setup(t);
  await mkdir(join(cwd, 'app'));
  await writeFile(join(cwd, 'package.json'), '{"name":"root","workspaces":["app"]}');
  await writeFile(join(cwd, 'knip.json'), '{"workspaces":{"app":{"entry":[],"project":["*.ts"]}}}');
  await writeFile(join(cwd, 'app/package.json'), '{"name":"app","devDependencies":{"vite":"*"}}');
  await writeFile(join(cwd, 'app/settings.json'), '{"include":["first.ts"]}');
  await writeFile(join(cwd, 'app/helper.ts'), "import settings from './settings.json'; export default settings;\n");
  await writeFile(
    join(cwd, 'app/vite.config.ts'),
    "import settings from './helper.ts'; export default { test: settings };\n"
  );
  await writeFile(join(cwd, 'app/first.ts'), 'export {};\n');
  await writeFile(join(cwd, 'app/second.ts'), 'export {};\n');
  const loadOptions = () => createOptions({ cwd, isSession: true, args: { workspace: 'app' } });
  const session = await createSession(await loadOptions());
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['app/second.ts']);
  await writeFile(join(cwd, 'app/settings.json'), '{"include":["second.ts"]}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'app/settings.json' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['app/first.ts']);
});

test('invalid JSON reloads recover on a subsequent edit and preserve preprocessing', async t => {
  const cwd = await setup(t);
  await writeFile(join(cwd, 'preprocessor.mjs'), 'export default input => input;\n');
  const loadOptions = () =>
    createOptions({ cwd, isSession: true, args: { preprocessor: [join(cwd, 'preprocessor.mjs')] } });
  const session = await createSession(await loadOptions());
  await writeFile(join(cwd, 'knip.json'), '{');
  await assert.rejects(session.handleFileChanges([{ type: 'modified', filePath: 'knip.json' }]));
  await writeFile(join(cwd, 'knip.json'), '{"entry":["src/*.ts"],"project":["src/**/*.ts"]}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'knip.json' }]);
  const fresh = await createSession(await loadOptions());
  assert.deepEqual(session.getIssues(), fresh.getIssues());
});

test('tsconfig aliases reload without reusing stale resolution caches', async t => {
  const cwd = await setup(t);
  await writeFile(join(cwd, 'src/index.ts'), "import { value } from '@value'; console.log(value);\n");
  await writeFile(join(cwd, 'src/first.ts'), 'export const value = 1;\n');
  await writeFile(join(cwd, 'src/second.ts'), 'export const value = 2;\n');
  await writeFile(join(cwd, 'tsconfig.json'), '{"compilerOptions":{"paths":{"@value":["./src/first.ts"]}}}');
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createSession(await loadOptions());
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
  await writeFile(join(cwd, 'tsconfig.json'), '{"compilerOptions":{"paths":{"@value":["./src/second.ts"]}}}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'tsconfig.json' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/first.ts']);
});

for (const changedFile of ['knip.js', 'helper.js']) {
  test(`ES module JavaScript configuration reloads when ${changedFile} changes`, async t => {
    const cwd = await setup(t);
    await writeFile(join(cwd, 'package.json'), '{"name":"configuration","type":"module"}');
    await rm(join(cwd, 'knip.json'));
    await writeFile(join(cwd, 'helper.js'), "export const ignore = ['src/first.ts'];\n");
    await writeFile(
      join(cwd, 'knip.js'),
      "import { ignore } from './helper.js'; export default { entry: ['src/index.ts'], project: ['src/**/*.ts'], ignore };\n"
    );
    const loadOptions = () => createOptions({ cwd, isSession: true });
    const session = await createSession(await loadOptions());
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
    await writeFile(
      join(cwd, changedFile),
      changedFile === 'helper.js'
        ? "export const ignore = ['src/second.ts'];\n"
        : "export default { entry: ['src/index.ts'], project: ['src/**/*.ts'], ignore: ['src/second.ts'] };\n"
    );
    await session.handleFileChanges([{ type: 'modified', filePath: changedFile }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/first.ts']);
  });
}

test('plugin configuration patterns match in a directory with glob characters', async t => {
  const cwd = await setup(t, 'knip-session-configuration (team) [1]-');
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createSession(await loadOptions());
  await writeFile(join(cwd, 'vite.config.ts'), "export default { test: { include: ['src/first.ts'] } };\n");
  await session.handleFileChanges([{ type: 'added', filePath: 'vite.config.ts' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
});

test('a new workspace manifest matching the workspace patterns reloads options', async t => {
  const cwd = await setup(t);
  await mkdir(join(cwd, 'packages/app'), { recursive: true });
  await writeFile(join(cwd, 'package.json'), '{"name":"root","workspaces":["packages/*"]}');
  await writeFile(join(cwd, 'knip.json'), '{}');
  await writeFile(join(cwd, 'packages/app/index.ts'), 'export {};\n');
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createSession(await loadOptions());
  assert.deepEqual(session.getIssues().issues.dependencies, {});
  await writeFile(join(cwd, 'packages/app/package.json'), '{"name":"app","dependencies":{"left-pad":"*"}}');
  await session.handleFileChanges([{ type: 'added', filePath: 'packages/app/package.json' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.dependencies), ['packages/app/package.json']);
});
