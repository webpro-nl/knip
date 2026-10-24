import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

for (const fixture of ['v2', 'v1', 'templates']) {
  test(`Find Buf generator dependencies and entries (${fixture})`, async () => {
    const cwd = resolve(`fixtures/plugins/buf/${fixture}`);
    const options = await createOptions({ cwd });
    const { counters } = await main(options);

    assert.deepEqual(counters, {
      ...baseCounters,
      processed: 1,
      total: 1,
    });
  });
}
