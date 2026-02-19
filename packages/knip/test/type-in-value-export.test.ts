import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/type-in-value-export');

test('Find unused types in value exports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.types['src/api.ts']['GetPoints']);
  assert(issues.types['src/api.ts']['GetPointsResponse']);
  assert(issues.types['src/api.ts']['GetPointsParams']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 3,
    processed: 2,
    total: 2,
  });
});
