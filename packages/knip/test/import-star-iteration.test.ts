import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/import-star-iteration');

test('Handle usage of members of a namespace when imported using * and iterating', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  // Classes Orange and Apple are both used using a for (...in) loop
  // Classes Broccoli and Spinach are both used using a for (...of) loop
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
