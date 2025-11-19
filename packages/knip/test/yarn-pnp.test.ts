import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js'

test('Allow peer dependencies in yarn pnp', async () => {
  const cwd = resolve('fixtures/yarn-pnp/packages/peer-dependencies');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

test('Find unused types dependencies in yarn pnp', async () => {
  const cwd = resolve('fixtures/yarn-pnp/packages/dependencies-types');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
    devDependencies: 2,
  });
});
