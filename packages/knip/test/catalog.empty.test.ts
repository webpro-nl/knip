import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

test('Should handle empty named catalog entries without null pointer error', async () => {
  const cwd = resolve('fixtures/catalog-named-empty');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['prod.lodash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 1,
    processed: 1,
    total: 1,
  });
});
