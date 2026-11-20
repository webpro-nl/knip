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
import { copyFixture } from '../helpers/copy-fixture.ts';

test('Warm cache runs leave an unchanged cache untouched and store pristine analysis nodes', async t => {
  const cwd = await copyFixture('fixtures/resolution/tsconfig-cli-paths');
  const cacheLocation = toPosix(realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-stable-data-'))));
  t.after(() => {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  });
  const run = async (cache = true) =>
    main(await createOptions({ cwd, args: { cache, 'cache-location': cacheLocation, tsConfig: 'tsconfig.app.json' } }));
  const cacheFile = () => join(cacheLocation, readdirSync(cacheLocation).find(name => name.startsWith('root-')) ?? '');

  await run();
  const initial = readFileSync(cacheFile());
  utimesSync(cacheFile(), 1, 1);

  for (let i = 0; i < 3; i++) {
    assert.deepEqual(await run(), await run(false));
    assert.deepEqual(readFileSync(cacheFile()), initial);
    assert.equal(statSync(cacheFile()).mtimeMs, 1000);
  }

  writeFileSync(join(cwd, 'src/used.ts'), "export const used = () => 'used'; export const replaced = 2;");
  assert.deepEqual(Object.keys((await run()).issues.exports['src/used.ts']), ['replaced']);
  const records = deserialize(readFileSync(cacheFile()));
  assert.ok(records instanceof Map);
  assert.equal(records.size, 2);
  for (const meta of records.values()) {
    assert.equal(meta.data.importedBy, undefined);
    assert.equal(meta.data.internalImportCache, undefined);
  }
});
