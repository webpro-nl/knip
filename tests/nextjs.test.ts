import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Support NextJS files', async () => {
  const cwd = resolve('fixtures/nextjs');

  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  console.log({ counters });

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 0,
    processed: 3,
    total: 3,
  });
});
