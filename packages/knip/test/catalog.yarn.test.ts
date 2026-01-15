import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

test('Should track referenced default catalog entries', async () => {
  const cwd = resolve('fixtures/catalog-yarn');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['.yarnrc.yml']['default.@lo/dash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 1,
    processed: 1,
    total: 1,
  });
});
