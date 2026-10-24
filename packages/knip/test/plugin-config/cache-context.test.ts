import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import { Plugins } from '../../src/plugins.ts';
import type { JSONReport } from '../../src/reporters/json.ts';
import type { Plugin, WorkspaceConfiguration } from '../../src/types/config.ts';
import type { MainOptions } from '../../src/util/create-options.ts';
import { toConfig, toDependency, toEntry } from '../../src/util/input.ts';
import { createManifest } from '../../src/util/package-json.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

type WorkerOptions = ConstructorParameters<typeof WorkspaceWorker>[0];

const createConfig = (): WorkspaceConfiguration => ({
  entry: [],
  project: [],
  paths: {},
  ignore: [],
  ignoreFiles: [],
  ignoreGlobalBinaries: true,
  ignoreExportsUsedInFile: false,
  isIncludeEntryExports: false,
  vitest: true,
});

const createFixture = (t: TestContext) => {
  const cwd = mkdtempSync(join(tmpdir(), 'knip-plugin-cache-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, 'package.json'), '{"name":"plugin-cache"}\n');
  return { cwd, cacheLocation: join(cwd, '.cache') };
};

const createRunner = (t: TestContext, plugin: Partial<Plugin>) => {
  const { cwd, cacheLocation } = createFixture(t);
  const configFilePath = join(cwd, 'plugin.config.json');
  writeFileSync(configFilePath, '{}\n');
  const original = Plugins.vitest;
  Plugins.vitest = { title: 'Cache test', config: [configFilePath], ...plugin };
  t.after(() => {
    Plugins.vitest = original;
  });

  const run = async (
    overrides: Partial<WorkerOptions> = {},
    optionOverrides: Partial<MainOptions> = {},
    prepare?: (worker: WorkspaceWorker) => void
  ) => {
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    const config = createConfig();
    const worker = new WorkspaceWorker({
      name: '.',
      dir: cwd,
      config,
      manifest: { name: 'plugin-cache' },
      dependencies: new Set(),
      rootManifest: undefined,
      handleInput: input => input.specifier,
      handleConfigLoadError: () => assert.fail('Unexpected config load failure'),
      findWorkspaceByFilePath: () => ({
        name: '.',
        dir: cwd,
        config,
        ancestors: [],
        manifestPath: join(cwd, 'package.json'),
        manifestStr: '{}',
        pkgName: 'plugin-cache',
        ignoreMembers: [],
      }),
      getManifest: () => undefined,
      readRawFile: filePath => {
        try {
          return readFileSync(filePath, 'utf8');
        } catch {
          return '';
        }
      },
      negatedWorkspacePatterns: [],
      ignoredWorkspacePatterns: [],
      enabledPluginsInAncestors: [],
      configFilesMap: new Map(),
      options: { ...options, ...optionOverrides },
      ...overrides,
    });
    worker.enabledPlugins = ['vitest'];
    worker.enabledPluginsMap.vitest = true;
    prepare?.(worker);
    const inputs = await worker.runPlugins();
    worker.onDispose();
    return inputs.filter(input => input.specifier !== configFilePath);
  };

  return { cwd, cacheLocation, configFilePath, run };
};

test('Plugin cache context invalidates changed workspace inputs and retains warm results', async t => {
  const cases: [string, Partial<WorkerOptions>, Partial<MainOptions>?][] = [
    ['config', { config: { ...createConfig(), vitest: { config: null, project: null, entry: ['selected.ts'] } } }],
    ['manifest', { manifest: { name: 'changed-manifest' } }],
    ['root manifest', { rootManifest: createManifest({ name: 'changed-root' }) }],
    ['dependencies', { dependencies: new Set(['additional-dependency']) }],
    ['ancestor plugins', { enabledPluginsInAncestors: ['oxlint'] }],
    ['production', {}, { isProduction: true }],
    ['strict', {}, { isStrict: true }],
  ];

  for (const [name, overrides, optionOverrides] of cases) {
    await t.test(name, async t => {
      let calls = 0;
      const { run } = createRunner(t, {
        resolveConfig: () => [toEntry(`selected-${++calls}.ts`)],
      });
      const cold = await run();
      assert.deepEqual(await run(), cold);
      assert.equal(calls, 1);
      const changed = await run(overrides, optionOverrides);
      assert.equal(calls, 2);
      assert.ok(changed.some(input => input.specifier === 'selected-2.ts'));
      assert.deepEqual(await run(overrides, optionOverrides), changed);
      assert.equal(calls, 2);
    });
  }
});

test('Plugin cache context separates workspace and root directories for the same config file', async t => {
  const { cwd, run } = createRunner(t, {
    resolveConfig: (_config, options) => [toEntry(join(options.cwd, 'selected.ts')), toEntry(options.rootCwd)],
  });
  const child = join(cwd, 'child');
  mkdirSync(child);
  const cold = await run();
  assert.deepEqual(await run(), cold);
  const moved = await run({ dir: child });
  assert.ok(moved.some(input => input.specifier === join(child, 'selected.ts')));
  assert.deepEqual(await run({ dir: child }), moved);
  const rootChanged = await run({ dir: child }, { cwd: child });
  assert.ok(rootChanged.some(input => input.specifier === child));
});

test('Plugin cache context includes configuration assigned after worker construction', async t => {
  const { run } = createRunner(t, {
    resolveConfig: (_config, options) => [toEntry(options.config.entry?.[0] ?? 'original.ts')],
  });
  assert.ok((await run()).some(input => input.specifier === 'original.ts'));
  const prepare = (worker: WorkspaceWorker) => {
    worker.config = { ...worker.config, vitest: { config: null, project: null, entry: ['updated.ts'] } };
  };
  const updated = await run({}, {}, prepare);
  assert.ok(updated.every(input => input.specifier === 'updated.ts'));
  assert.deepEqual(await run({}, {}, prepare), updated);
});

test('Plugin cache checks AST reads after edits, deletion and creation', async t => {
  let calls = 0;
  const { cwd, run } = createRunner(t, {
    resolveFromAST: (_program, options) => {
      calls++;
      return [toEntry(options.readFile(join(options.cwd, 'selection.txt')) || 'missing.ts')];
    },
  });
  const filePath = join(cwd, 'selection.txt');
  writeFileSync(filePath, 'first.ts');
  const cold = await run();
  assert.deepEqual(await run(), cold);
  assert.equal(calls, 1);

  const stat = statSync(filePath);
  writeFileSync(filePath, 'other.ts');
  utimesSync(filePath, stat.atime, stat.mtime);
  assert.ok((await run()).some(input => input.specifier === 'other.ts'));
  assert.equal(calls, 2);

  rmSync(filePath);
  const missing = await run();
  assert.ok(missing.some(input => input.specifier === 'missing.ts'));
  assert.deepEqual(await run(), missing);
  assert.equal(calls, 3);

  writeFileSync(filePath, 'third.ts');
  const created = await run();
  assert.ok(created.some(input => input.specifier === 'third.ts'));
  assert.deepEqual(await run(), created);
  assert.equal(calls, 4);
});

test('Plugin cache rejects a dependency changed between repeated reads', async t => {
  let calls = 0;
  const { cwd, run } = createRunner(t, {
    resolveFromAST: (_program, options) => {
      calls++;
      const first = options.readFile(join(options.cwd, 'selection.txt'));
      options.readFile(join(options.cwd, 'selection.txt'));
      return [toEntry(first)];
    },
  });
  const filePath = join(cwd, 'selection.txt');
  writeFileSync(filePath, 'first.ts');
  const readRawFile = (path: string) => {
    const contents = readFileSync(path, 'utf8');
    if (path === filePath && contents === 'first.ts') writeFileSync(filePath, 'other.ts');
    return contents;
  };
  assert.ok((await run({ readRawFile })).some(input => input.specifier === 'first.ts'));
  const changed = await run();
  assert.ok(changed.some(input => input.specifier === 'other.ts'));
  assert.equal(calls, 2);
  assert.deepEqual(await run(), changed);
  assert.equal(calls, 2);
});

test('Plugin cache preserves sibling results when one observed dependency changes', async t => {
  let vitestCalls = 0;
  let mochaCalls = 0;
  const { cwd, configFilePath, run } = createRunner(t, {
    resolveFromAST: (_program, options) => {
      vitestCalls++;
      return [toEntry(options.readFile(join(options.cwd, 'selection.txt')))];
    },
  });
  const original = Plugins.mocha;
  Plugins.mocha = {
    title: 'Sibling cache test',
    config: [configFilePath],
    resolveConfig: () => {
      mochaCalls++;
      return [toEntry('sibling.ts')];
    },
  };
  t.after(() => {
    Plugins.mocha = original;
  });
  const prepare = (worker: WorkspaceWorker) => {
    worker.enabledPlugins = ['vitest', 'mocha'];
  };
  const filePath = join(cwd, 'selection.txt');
  writeFileSync(filePath, 'first.ts');
  const cold = await run({}, {}, prepare);
  assert.deepEqual(await run({}, {}, prepare), cold);
  assert.deepEqual([vitestCalls, mochaCalls], [1, 1]);
  writeFileSync(filePath, 'other.ts');
  const changed = await run({}, {}, prepare);
  assert.ok(changed.some(input => input.specifier === 'other.ts'));
  assert.ok(changed.some(input => input.specifier === 'sibling.ts'));
  assert.deepEqual([vitestCalls, mochaCalls], [2, 1]);
  assert.deepEqual(await run({}, {}, prepare), changed);
  assert.deepEqual([vitestCalls, mochaCalls], [2, 1]);
});

test('Plugin cache checks files read while filtering transitive dependencies', async t => {
  let calls = 0;
  const { cwd, configFilePath, run } = createRunner(t, {
    isFilterTransitiveDependencies: true,
    resolveConfig: () => {
      calls++;
      return [toDependency('selected-dependency')];
    },
  });
  writeFileSync(configFilePath, '{"helper":"./helper.js"}\n');
  const helperPath = join(cwd, 'helper.js');
  writeFileSync(helperPath, 'export default "selected-dependency";\n');
  const cold = await run();
  assert.equal(cold.find(input => input.specifier === 'selected-dependency')?.optional, undefined);
  assert.deepEqual(await run(), cold);
  assert.equal(calls, 1);

  writeFileSync(helperPath, 'export default "another-dependency";\n');
  const changed = await run();
  assert.equal(changed.find(input => input.specifier === 'selected-dependency')?.optional, true);
  assert.equal(calls, 2);
  assert.deepEqual(await run(), changed);
  assert.equal(calls, 2);
});

test('Plugin cache separates direct and recursive config resolution', async t => {
  let direct = false;
  let configFilePath = '';
  const runner = createRunner(t, {
    config: () => (direct ? [configFilePath] : []),
    resolve: () => [toConfig('vitest', configFilePath)],
    resolveConfig: (_config, options) => [toEntry(options.isResolvedConfigFile ? 'recursive.ts' : 'direct.ts')],
  });
  configFilePath = runner.configFilePath;
  const recursive = await runner.run();
  assert.ok(recursive.some(input => input.specifier === 'recursive.ts'));
  assert.deepEqual(await runner.run(), recursive);
  direct = true;
  const directInputs = await runner.run();
  assert.ok(directInputs.some(input => input.specifier === 'direct.ts'));
  assert.deepEqual(await runner.run(), directInputs);
});

test('Executable plugin configs react to environment changes and stay cached on unchanged runs', t => {
  const { cwd, cacheLocation } = createFixture(t);
  writeFileSync(join(cwd, 'knip.json'), '{"entry":[],"project":["*.js"],"mocha":true}');
  writeFileSync(join(cwd, 'first.js'), 'export const first = true;\n');
  writeFileSync(join(cwd, 'other.js'), 'export const other = true;\n');
  writeFileSync(
    join(cwd, '.mocharc.cjs'),
    'require("node:fs").appendFileSync(__dirname + "/executions.txt", "run\\n");\n' +
      'module.exports = { spec: process.env.KNIP_CACHE_TEST_ENTRY };\n'
  );
  const run = (entry: string) => {
    const result = spawnSync(
      process.execPath,
      [resolve('src/cli.ts'), '--directory', cwd, '--cache', '--cache-location', cacheLocation, '--reporter', 'json'],
      {
        encoding: 'utf8',
        env: { ...process.env, KNIP_CACHE_TEST_ENTRY: entry, KNIP_CACHE_TEST_SECRET: 'private-value' },
      }
    );
    assert.equal(result.status, 1, result.stderr);
    const report: JSONReport = JSON.parse(result.stdout);
    const files: string[] = [];
    for (const issue of report.issues) if (issue.files?.length) files.push(issue.file);
    return files;
  };

  assert.deepEqual(run('first.js'), ['other.js']);
  assert.deepEqual(run('first.js'), ['other.js']);
  assert.equal(readFileSync(join(cwd, 'executions.txt'), 'utf8'), 'run\n');
  assert.deepEqual(run('other.js'), ['first.js']);
  assert.deepEqual(run('other.js'), ['first.js']);
  assert.equal(readFileSync(join(cwd, 'executions.txt'), 'utf8'), 'run\nrun\n');
  for (const name of readdirSync(cacheLocation)) {
    assert.equal(readFileSync(join(cacheLocation, name)).includes(Buffer.from('private-value')), false);
  }
});
