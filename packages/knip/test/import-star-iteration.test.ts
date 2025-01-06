import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main as knip } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/import-star-iteration');

test('Handle usage of members of a namespace when imported using * and iterating', async () => {
  const { counters } = await knip({
    ...baseArguments,
    cwd,
  });

  // Classes Orange and Apple are both used using a for (...in) loop
  // Classes Broccoli and Spinach are both used using a for (...of) loop
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
