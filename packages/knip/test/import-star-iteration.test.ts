import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

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
