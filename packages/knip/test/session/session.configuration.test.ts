import assert from 'node:assert/strict';
import { cp, copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import test, { type TestContext } from 'node:test';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const setup = async (t: TestContext, prefix = 'knip-session-configuration-') => {
  const cwd = await copyFixture('fixtures/session-configuration', prefix);
  t.after(() => rm(cwd, { recursive: true, force: true }));
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
  const loadOptions = () =>
    createOptions({ cwd, isSession: true, args: { cache: true, config: 'config/knip-vite.json' } });
  const session = await createSession(await loadOptions());
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
  await writeFile(join(cwd, 'config/settings.json'), '{"test":{"include":["src/second.ts"]}}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'config/settings.json' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/first.ts']);
});

for (const changedFile of ['vite.config.ts', 'config/settings.json']) {
  test(`workspace plugin configuration reloads when ${changedFile} changes`, async t => {
    const cwd = await setup(t);
    await copyFile(join(cwd, 'config/vite.config.ts'), join(cwd, 'vite.config.ts'));
    const loadOptions = () => createOptions({ cwd, isSession: true });
    const session = await createSession(await loadOptions());
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
    await writeFile(
      join(cwd, changedFile),
      changedFile.endsWith('.json')
        ? '{"test":{"include":["src/second.ts"]}}'
        : "export default { test: { include: ['src/second.ts'] } };\n"
    );
    await session.handleFileChanges([{ type: 'modified', filePath: changedFile }]);
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/first.ts']);
  });
}

for (const configFile of ['vite.config.js', 'vite.config.cjs']) {
  test(`CommonJS workspace plugin configuration reloads when ${configFile} changes`, async t => {
    const cwd = await setup(t);
    await copyFile(join(cwd, 'config/vite.config.cjs'), join(cwd, configFile));
    const loadOptions = () => createOptions({ cwd, isSession: true });
    const session = await createSession(await loadOptions());
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
    await writeFile(join(cwd, configFile), "module.exports = { test: { include: ['src/second.ts'] } };\n");
    await session.handleFileChanges([{ type: 'modified', filePath: configFile }]);
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
  const app = join(cwd, 'packages/app');
  await cp(resolve('fixtures/session-configuration'), app, { recursive: true });
  await copyFile(resolve('fixtures/workspaces/config-hints/package.json'), join(cwd, 'package.json'));
  await copyFile(join(app, 'config/vite.config.ts'), join(app, 'vite.config.ts'));
  const loadOptions = () =>
    createOptions({
      cwd,
      isSession: true,
      args: { workspace: ['packages/app'], config: 'config/knip-workspace.json' },
    });
  const session = await createSession(await loadOptions());
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['packages/app/src/second.ts']);
  await writeFile(join(app, 'config/settings.json'), '{"test":{"include":["src/second.ts"]}}');
  await session.handleFileChanges([{ type: 'modified', filePath: 'packages/app/config/settings.json' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['packages/app/src/first.ts']);
});

test('invalid JSON reloads recover on a subsequent edit and preserve preprocessing', async t => {
  const cwd = await setup(t);
  const loadOptions = () =>
    createOptions({
      cwd,
      isSession: true,
      args: { preprocessor: [resolve('fixtures/config-preprocessor-chain/first.js')] },
    });
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
  await copyFile(join(cwd, 'config/alias-index.ts'), join(cwd, 'src/index.ts'));
  await copyFile(join(cwd, 'config/tsconfig.json'), join(cwd, 'tsconfig.json'));
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
    await copyFile(resolve('fixtures/load-esm/package.json'), join(cwd, 'package.json'));
    const loadOptions = () => createOptions({ cwd, isSession: true, args: { config: 'config/knip.js' } });
    const session = await createSession(await loadOptions());
    assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
    await writeFile(
      join(cwd, 'config', changedFile),
      changedFile === 'helper.js'
        ? "export const ignore = ['src/second.ts'];\n"
        : "export default { entry: ['src/index.ts'], project: ['src/**/*.ts'], ignore: ['src/second.ts'] };\n"
    );
    await session.handleFileChanges([{ type: 'modified', filePath: `config/${changedFile}` }]);
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
  await copyFile(resolve('fixtures/workspaces/config-hints/package.json'), join(cwd, 'package.json'));
  await copyFile(join(cwd, 'src/index.ts'), join(cwd, 'packages/app/index.ts'));
  const loadOptions = () => createOptions({ cwd, isSession: true });
  const session = await createSession(await loadOptions());
  assert.deepEqual(session.getIssues().issues.dependencies, {});
  await writeFile(join(cwd, 'packages/app/package.json'), '{"name":"app","dependencies":{"left-pad":"*"}}');
  await session.handleFileChanges([{ type: 'added', filePath: 'packages/app/package.json' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.dependencies), ['packages/app/package.json']);
});

for (const { configFile, esm } of [
  { configFile: 'knip.ts', esm: true },
  { configFile: 'knip.js', esm: true },
  { configFile: 'knip.js', esm: false },
]) {
  test(`a session created after ${configFile}${esm ? '' : ' (CommonJS)'} changes reads the new configuration`, async t => {
    const cwd = await setup(t);
    if (esm) await copyFile(resolve('fixtures/load-esm/package.json'), join(cwd, 'package.json'));
    if (configFile === 'knip.ts') await copyFile(join(cwd, 'config/knip.js'), join(cwd, 'config/knip.ts'));
    if (!esm) await copyFile(join(cwd, 'config/knip.cjs'), join(cwd, 'config/knip.js'));
    const config = (ignore: string) =>
      `${esm ? 'export default' : 'module.exports ='} { entry: ['src/index.ts'], project: ['src/**/*.ts'], ignore: ['${ignore}'] };\n`;
    const loadOptions = () => createOptions({ cwd, isSession: true, args: { config: `config/${configFile}` } });
    const first = await createSession(await loadOptions());
    assert.deepEqual(Object.keys(first.getIssues().issues.files), ['src/second.ts']);
    await writeFile(join(cwd, 'config', configFile), config('src/second.ts'));
    const second = await createSession(await loadOptions());
    assert.deepEqual(Object.keys(second.getIssues().issues.files), ['src/first.ts']);
  });
}

test('the first load of an ES module configuration in a session resolves packages with the import condition', async t => {
  const cwd = await setup(t);
  await copyFile(resolve('fixtures/load-esm/package.json'), join(cwd, 'package.json'));
  const session = await createSession(
    await createOptions({ cwd, isSession: true, args: { config: 'config/knip.js' } })
  );
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
});

test('the first load of a configuration with top-level await and a TypeScript helper in a session', async t => {
  const cwd = await setup(t);
  await copyFile(resolve('fixtures/load-esm/package.json'), join(cwd, 'package.json'));
  const session = await createSession(
    await createOptions({ cwd, isSession: true, args: { config: 'config/knip-await.js' } })
  );
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
});

test('a configuration change does not reload untouched configuration files', async t => {
  const cwd = await setup(t);
  const session = await createSession(
    await createOptions({ cwd, isSession: true, args: { config: 'config/knip-webpack.json' } })
  );
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
  await writeFile(join(cwd, 'config/other.config.cjs'), 'module.exports = { entry: [] };\n\n');
  await session.handleFileChanges([{ type: 'modified', filePath: 'config/other.config.cjs' }]);
  assert.deepEqual(Object.keys(session.getIssues().issues.files), ['src/second.ts']);
});
