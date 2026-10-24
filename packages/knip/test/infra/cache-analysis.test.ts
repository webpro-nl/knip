import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { deserialize } from 'node:v8';
import { main } from '../../src/index.ts';
import { isGitignoreCacheEnabled } from '../../src/util/gitignore-cache.ts';
import { isGlobCacheEnabled } from '../../src/util/glob-cache.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const setup = (t: TestContext) => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-analysis-')));
  const cache = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-data-')));
  t.after(() => {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cache, { recursive: true, force: true });
  });
  const write = (file: string, contents: string) => writeFileSync(join(cwd, file), contents);
  write('package.json', '{"name":"cache-analysis"}');
  write('knip.json', '{"entry":["index.ts"],"project":["*.ts"]}');
  const run = async (cached = true) =>
    main(await createOptions({ cwd, args: { cache: cached, 'cache-location': cache } }));
  const parity = async () => {
    const cached = await run();
    assert.deepEqual(cached, await run(false));
    return cached;
  };
  const graphCache = () => join(cache, readdirSync(cache).find(name => name.startsWith('root-')) ?? 'missing');
  return { cwd, cache, write, run, parity, graphCache };
};

test('Cached graph facts do not accumulate derived imports or rewrite unchanged analyses', async t => {
  const { write, run, parity, graphCache } = setup(t);
  write('package.json', '{"name":"cache-analysis","dependencies":{"@value":"*"}}');
  write('knip.json', '{"entry":["index.ts"],"project":["*.ts"],"paths":{"@value":["./value.ts"]}}');
  write('index.ts', "import { value } from '@value'; console.log(value);");
  write('value.ts', 'export const value = 1; export const unused = 2;');
  await run();
  const path = graphCache();
  const initial = readFileSync(path);
  utimesSync(path, 1, 1);
  for (let index = 0; index < 3; index++) {
    await parity();
    assert.deepEqual(readFileSync(path), initial);
    assert.equal(statSync(path).mtimeMs, 1000);
  }
  write('value.ts', 'export const value = 1; export const replaced = 2;');
  await parity();
  const records = deserialize(readFileSync(path));
  assert.ok(records instanceof Map);
  for (const meta of records.values()) {
    assert.equal(meta.data.importedBy, undefined);
    assert.equal(meta.data.internalImportCache, undefined);
  }
  const updated = readFileSync(path);
  await parity();
  assert.deepEqual(readFileSync(path), updated);
});

test('Cached discovery notices newly created root and nested gitignores', async t => {
  const { cwd, write, run, parity } = setup(t);
  write('knip.json', '{"entry":["index.ts"],"project":["**/*.ts"]}');
  write('index.ts', 'export {};');
  mkdirSync(join(cwd, 'nested'));
  write('nested/unused.ts', 'export const unused = 1;');
  await run();
  write('nested/.gitignore', 'unused.ts\n');
  assert.deepEqual((await parity()).issues.files, {});
  rmSync(join(cwd, 'nested/.gitignore'));
  await parity();
  write('.gitignore', 'nested/\n');
  assert.deepEqual((await parity()).issues.files, {});
});

test('Reached-only files receive full analysis when promoted to project files', async t => {
  const { cwd, write, run, parity, graphCache } = setup(t);
  write('knip.json', '{"entry":["index.ts"],"project":["index.ts"]}');
  write('index.ts', "import { value } from './value'; console.log(value);");
  write('value.ts', 'export const value = 1; export const unused = 2;');
  await run();
  const records = deserialize(readFileSync(graphCache()));
  assert.ok(records instanceof Map);
  assert.equal(records.has(join(cwd, 'value.ts')), false);
  write('knip.json', '{"entry":["index.ts"],"project":["*.ts"]}');
  const result = await parity();
  assert.deepEqual(Object.keys(result.issues.exports['value.ts']), ['unused']);
});

test('Cached analyses refresh aliases and ignoreExportsUsedInFile settings', async t => {
  const { write, run, parity } = setup(t);
  write('index.ts', "import { value } from '@value'; console.log(value);");
  write('value.ts', 'export const value = 1; export const unused = 2; console.log(unused);');
  write('second.ts', 'export const value = 2;');
  write('knip.json', '{"entry":["index.ts"],"project":["*.ts"],"paths":{"@value":["./value.ts"]}}');
  await run();
  write(
    'knip.json',
    '{"entry":["index.ts"],"project":["*.ts"],"paths":{"@value":["./value.ts"]},"ignoreExportsUsedInFile":true}'
  );
  assert.deepEqual((await parity()).issues.exports, {});
  write('knip.json', '{"entry":["index.ts"],"project":["*.ts"],"paths":{"@value":["./second.ts"]}}');
  assert.deepEqual(Object.keys((await parity()).issues.files), ['value.ts']);
});

test('Cached analyses notice source changes with restored mtime and unchanged size', async t => {
  const { cwd, write, run, parity } = setup(t);
  write('index.ts', "import { value } from './value'; console.log(value);");
  write('value.ts', 'export const value = 1; export const unused = 2;');
  const path = join(cwd, 'value.ts');
  utimesSync(path, 1000, 1000);
  const before = statSync(path);
  await run();
  write('value.ts', 'export const value = 1; export const spared = 2;');
  utimesSync(path, before.atime, before.mtime);
  assert.deepEqual(Object.keys((await parity()).issues.exports['value.ts']), ['spared']);
});

test('Cached resolutions refresh when project targets are created, removed, or shadowed', async t => {
  const { cwd, write, run, parity } = setup(t);
  write('knip.json', '{"entry":["index.ts"],"project":["**/*.ts"]}');
  write('index.ts', "import { value } from './fruit'; console.log(value);");
  await run();
  mkdirSync(join(cwd, 'fruit'));
  write('fruit/index.ts', 'export const value = 1;');
  assert.deepEqual((await parity()).issues.unresolved, {});
  write('fruit.ts', 'export const value = 2;');
  assert.deepEqual(Object.keys((await parity()).issues.files), ['fruit/index.ts']);
  rmSync(join(cwd, 'fruit.ts'));
  assert.deepEqual((await parity()).issues.files, {});
  rmSync(join(cwd, 'fruit/index.ts'));
  rmSync(join(cwd, 'fruit'), { recursive: true });
  assert.ok((await parity()).issues.unresolved['index.ts']);
});

test('Cached analysis follows changed tsconfig aliases and package imports', async t => {
  const { write, run, parity } = setup(t);
  write('index.ts', "import { value } from '@value'; console.log(value);");
  write('apple.ts', 'export const value = 1;');
  write('pear.ts', 'export const value = 2;');
  write('tsconfig.json', '{"compilerOptions":{"paths":{"@value":["./apple.ts"]}}}');
  await run();
  write('tsconfig.json', '{"compilerOptions":{"paths":{"@value":["./pear.ts"]}}}');
  assert.deepEqual(Object.keys((await parity()).issues.files), ['apple.ts']);
  write('index.ts', "import { value } from '#value'; console.log(value);");
  write('package.json', '{"name":"cache-analysis","imports":{"#value":"./apple.ts"}}');
  await parity();
  write('package.json', '{"name":"cache-analysis","imports":{"#value":"./pear.ts"}}');
  assert.deepEqual(Object.keys((await parity()).issues.files), ['apple.ts']);
});

test('An uncached run does not reuse or update discovery caches from a preceding cached run', async t => {
  const { write, run, cache } = setup(t);
  write('index.ts', 'export {};');
  await run();
  assert.equal(isGlobCacheEnabled(), true);
  assert.equal(isGitignoreCacheEnabled(), true);
  const paths = readdirSync(cache);
  const before = paths.map(path => readFileSync(join(cache, path)));
  await run(false);
  assert.equal(isGlobCacheEnabled(), false);
  assert.equal(isGitignoreCacheEnabled(), false);
  assert.deepEqual(
    paths.map(path => readFileSync(join(cache, path))),
    before
  );
});
