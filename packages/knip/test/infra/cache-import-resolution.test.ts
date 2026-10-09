import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Cached files are re-analyzed when an import starts resolving', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-resolution-')));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async () => main(await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } }));

  writeFileSync(join(cwd, 'package.json'), '{"name":"cache-resolution"}');
  writeFileSync(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["*.ts"]}');
  writeFileSync(join(cwd, 'index.ts'), 'import { x } from "./banana";\nconsole.log(x);\n');

  try {
    assert.equal((await run()).counters.unresolved, 1);

    writeFileSync(join(cwd, 'banana.ts'), 'export const x = 1;\n');

    const warm = await run();
    assert.equal(warm.counters.unresolved, 0);
    assert.equal(warm.counters.files, 0);

    const unchanged = await run();
    assert.equal(unchanged.counters.unresolved, 0);
    assert.equal(unchanged.counters.files, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
