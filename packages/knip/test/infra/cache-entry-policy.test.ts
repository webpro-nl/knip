import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';

test('Cached files respect entry export policy changes', async () => {
  const cwd = await copyFixture('fixtures/entry/include-entry-exports-scripts');
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async () =>
    main(
      await createOptions({ cwd, isIncludeEntryExports: true, args: { cache: true, 'cache-location': cacheLocation } })
    );
  const config = readFileSync(join(cwd, 'knip.json'), 'utf8');

  try {
    assert.equal((await run()).counters.exports, 0);

    writeFileSync(join(cwd, 'knip.json'), '{"entry":["src/script1.ts"],"project":["src/**/*.ts"]}');
    assert.equal((await run()).counters.exports, 2);

    writeFileSync(join(cwd, 'knip.json'), config);
    assert.equal((await run()).counters.exports, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
