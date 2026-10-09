import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Repeated runs in one process see added import targets without a cache', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-rerun-')));
  const run = async () => main(await createOptions({ cwd }));
  writeFileSync(join(cwd, 'package.json'), '{"name":"orchard"}');
  writeFileSync(join(cwd, 'index.ts'), "import { banana } from './banana';\nconsole.log(banana);\n");

  try {
    assert.equal((await run()).counters.unresolved, 1);

    writeFileSync(join(cwd, 'banana.ts'), 'export const banana = 1;\n');

    assert.equal((await run()).counters.unresolved, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
