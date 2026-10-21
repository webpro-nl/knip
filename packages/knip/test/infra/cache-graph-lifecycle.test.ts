import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { run } from '../../src/run.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Cached native graphs follow baseUrl changes with unchanged source files and project topology', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-resolution-')));
  const cacheLocation = join(cwd, '.cache');
  const analyze = async (cache: boolean) =>
    (await run(await createOptions({ cwd, args: { cache, 'cache-location': cacheLocation } }))).results;
  const configure = (baseUrl: string) =>
    writeFileSync(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl } }));

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(join(cwd, 'knip.json'), JSON.stringify({ entry: ['index.ts'], project: ['**/*.ts'] }));
    writeFileSync(join(cwd, 'index.ts'), 'import { fruit } from "value"; console.log(fruit);');
    for (const directory of ['apple', 'banana']) {
      mkdirSync(join(cwd, directory));
      writeFileSync(join(cwd, directory, 'value.ts'), 'export const fruit = 1; export const unused = 2;');
    }
    configure('./apple');
    assert.deepEqual(Object.keys((await analyze(true)).issues.exports), ['apple/value.ts']);
    configure('./banana');
    const updated = await analyze(true);
    assert.deepEqual(Object.keys(updated.issues.exports), ['banana/value.ts']);
    assert.deepEqual(updated.issues, (await analyze(false)).issues);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Warm graph builds do not accumulate external imports or rewrite unchanged analysis', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-lifecycle-')));
  const cacheLocation = join(cwd, '.cache');
  const filePath = join(cwd, 'index.ts');

  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { 'fixture-package': '1.0.0' } }));
    writeFileSync(
      join(cwd, 'knip.json'),
      JSON.stringify({ entry: ['index.ts'], project: ['*.ts'], paths: { 'fixture-package': ['./module.ts'] } })
    );
    writeFileSync(filePath, 'import { fruit } from "fixture-package"; console.log(fruit);');
    writeFileSync(join(cwd, 'module.ts'), 'export const fruit = "apple";');

    const analyze = async () => {
      const options = await createOptions({
        cwd,
        args: { cache: true, 'cache-location': cacheLocation },
        isSession: true,
      });
      const result = await run(options);
      assert.ok(result.session);
      const file = result.session.getGraph().get(filePath);
      assert.ok(file);
      assert.deepEqual(
        Array.from(file.imports.external, item => item.specifier),
        ['fixture-package']
      );
      return result.results;
    };

    const cold = await analyze();
    const cacheName = readdirSync(cacheLocation).find(name => name.startsWith('root-'));
    assert.ok(cacheName);
    const cachePath = join(cacheLocation, cacheName);
    const bytes = readFileSync(cachePath);
    utimesSync(cachePath, 1, 1);

    for (let run = 0; run < 3; run++) {
      const warm = await analyze();
      assert.deepEqual(warm.issues, cold.issues);
      assert.deepEqual(warm.counters, cold.counters);
      assert.deepEqual(readFileSync(cachePath), bytes);
      assert.equal(statSync(cachePath).mtimeMs, 1000);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Cached analysis follows local-reference policy, dependencies, and resolution configuration', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-context-')));
  const cacheLocation = join(cwd, '.cache');
  const configPath = join(cwd, 'knip.json');
  const manifestPath = join(cwd, 'package.json');
  const analyze = async (cache: boolean) => {
    const options = await createOptions({ cwd, args: { cache, 'cache-location': cacheLocation }, isSession: true });
    return run(options);
  };
  const configure = (target: string, ignoreExportsUsedInFile: boolean) =>
    writeFileSync(
      configPath,
      JSON.stringify({
        entry: ['index.ts'],
        project: ['*.ts'],
        paths: { 'fixture-package': [target] },
        ignoreExportsUsedInFile,
      })
    );

  try {
    writeFileSync(manifestPath, JSON.stringify({ dependencies: { 'fixture-package': '1.0.0' } }));
    writeFileSync(join(cwd, 'index.ts'), 'import { fruit } from "fixture-package"; console.log(fruit);');
    const source = 'export const fruit = "apple"; export const local = 1; console.log(local);';
    writeFileSync(join(cwd, 'apple.ts'), source);
    writeFileSync(join(cwd, 'banana.ts'), source);
    configure('./apple.ts', false);
    const initial = await analyze(true);
    assert.deepEqual(Object.keys(initial.results.issues.exports['apple.ts']), ['local']);

    configure('./apple.ts', true);
    const localReferences = await analyze(true);
    assert.equal(localReferences.results.counters.exports, 0);
    assert.deepEqual(localReferences.results.issues, (await analyze(false)).results.issues);

    configure('./banana.ts', false);
    const resolved = await analyze(true);
    assert.deepEqual(Object.keys(resolved.results.issues.exports['banana.ts']), ['local']);
    assert.deepEqual(resolved.results.issues, (await analyze(false)).results.issues);

    writeFileSync(manifestPath, '{}');
    const removedDependency = await analyze(true);
    assert.ok(removedDependency.session);
    assert.equal(removedDependency.session.getGraph().get(join(cwd, 'index.ts'))?.imports.external.size, 0);
    assert.deepEqual(removedDependency.results.issues, (await analyze(false)).results.issues);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Enabling and disabling a source visitor invalidates cached file analysis', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-visitors-')));
  const cacheLocation = join(cwd, '.cache');
  const analyze = async (webpack: boolean) => {
    writeFileSync(join(cwd, 'knip.json'), JSON.stringify({ entry: ['index.ts'], project: ['**/*.ts'], webpack }));
    const options = await createOptions({
      cwd,
      args: { cache: true, 'cache-location': cacheLocation },
      isSession: true,
    });
    return run(options);
  };

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(join(cwd, 'index.ts'), 'require.context("./modules", true, /\\.ts$/);');
    mkdirSync(join(cwd, 'modules'));
    writeFileSync(join(cwd, 'modules/apple.ts'), 'export const fruit = "apple";');
    assert.equal((await analyze(false)).results.counters.files, 1);
    assert.equal((await analyze(true)).results.counters.files, 0);
    assert.equal((await analyze(false)).results.counters.files, 1);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Cached sessions resolve added and deleted targets from unchanged importers', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-session-')));
  const cacheLocation = join(cwd, '.cache');
  const modulePath = join(cwd, 'module.ts');

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(join(cwd, 'knip.json'), JSON.stringify({ entry: ['index.ts'], project: ['*.ts'] }));
    writeFileSync(join(cwd, 'index.ts'), 'import { fruit } from "./module"; console.log(fruit);');
    const options = await createOptions({
      cwd,
      args: { cache: true, 'cache-location': cacheLocation },
      isSession: true,
    });
    const { session } = await run(options);
    assert.ok(session);
    assert.equal(session.getIssues().counters.unresolved, 1);

    writeFileSync(modulePath, 'export const fruit = "apple";');
    await session.handleFileChanges([{ type: 'added', filePath: modulePath }]);
    assert.equal(session.getIssues().counters.unresolved, 0);
    assert.equal(session.getGraph().get(join(cwd, 'index.ts'))?.imports.internal.has(modulePath), true);

    rmSync(modulePath);
    await session.handleFileChanges([{ type: 'deleted', filePath: modulePath }]);
    assert.equal(session.getIssues().counters.unresolved, 1);
    assert.equal(session.getGraph().get(join(cwd, 'index.ts'))?.imports.internal.has(modulePath), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('An imported graph placeholder never substitutes for file analysis', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-graph-placeholder-')));
  const cacheLocation = join(cwd, '.cache');
  const analyze = async (project: string[]) => {
    writeFileSync(join(cwd, 'knip.json'), JSON.stringify({ entry: ['index.ts'], project }));
    const options = await createOptions({
      cwd,
      args: { cache: true, 'cache-location': cacheLocation },
      isSession: true,
    });
    return run(options);
  };

  try {
    writeFileSync(join(cwd, 'package.json'), '{}');
    writeFileSync(join(cwd, 'index.ts'), 'import "./module";');
    writeFileSync(join(cwd, 'module.ts'), 'export const fruit = "apple";');
    assert.equal((await analyze(['index.ts'])).results.counters.exports, 0);
    assert.deepEqual(Object.keys((await analyze(['*.ts'])).results.issues.exports['module.ts']), ['fruit']);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
