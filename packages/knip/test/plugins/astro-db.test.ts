import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../../src/util/create-options.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/astro-db');

test('Find dependencies with the astro-db plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});
