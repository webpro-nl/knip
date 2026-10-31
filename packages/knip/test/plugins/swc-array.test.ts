import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies in SWC config arrays', async () => {
  const cwd = resolve('fixtures/plugins/swc-array');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});
