import assert from 'node:assert/strict';
import {
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
import test from 'node:test';
import { deserialize } from 'node:v8';
import { main } from '../../src/index.ts';
import { join, toPosix } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Warm cache runs leave an unchanged cache untouched and store pristine analysis nodes', async t => {
  const cwd = toPosix(realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-stable-'))));
  const cacheLocation = toPosix(realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-stable-data-'))));
  t.after(() => {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  });
  const write = (file: string, contents: string) => writeFileSync(join(cwd, file), contents);
  write('package.json', '{"name":"cache-stable","dependencies":{"@value":"*"}}');
  write('knip.json', '{"entry":["index.ts"],"project":["*.ts"],"paths":{"@value":["./value.ts"]}}');
  write('index.ts', "import { value } from '@value'; console.log(value);");
  write('value.ts', 'export const value = 1; export const unused = 2;');

  const run = async (cache = true) =>
    main(await createOptions({ cwd, args: { cache, 'cache-location': cacheLocation } }));
  const cacheFile = () => join(cacheLocation, readdirSync(cacheLocation).find(name => name.startsWith('root-')) ?? '');

  await run();
  const initial = readFileSync(cacheFile());
  utimesSync(cacheFile(), 1, 1);

  for (let i = 0; i < 3; i++) {
    assert.deepEqual(await run(), await run(false));
    assert.deepEqual(readFileSync(cacheFile()), initial);
    assert.equal(statSync(cacheFile()).mtimeMs, 1000);
  }

  write('value.ts', 'export const value = 1; export const replaced = 2;');
  assert.deepEqual(Object.keys((await run()).issues.exports['value.ts']), ['replaced']);
  const records = deserialize(readFileSync(cacheFile()));
  assert.ok(records instanceof Map);
  assert.equal(records.size, 2);
  for (const meta of records.values()) {
    assert.equal(meta.data.importedBy, undefined);
    assert.equal(meta.data.internalImportCache, undefined);
  }
});
