import assert from 'node:assert/strict';
import { copyFileSync, rmSync } from 'node:fs';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { resolve } from '../helpers/resolve.ts';

test('Repeated runs in one process see added import targets without a cache', async () => {
  const cwd = await copyFixture('fixtures/session-incremental');
  const run = async () => main(await createOptions({ cwd }));
  rmSync(join(cwd, 'value.ts'));

  try {
    assert.equal((await run()).counters.unresolved, 1);

    copyFileSync(resolve('fixtures/session-incremental/value.ts'), join(cwd, 'value.ts'));

    assert.equal((await run()).counters.unresolved, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
