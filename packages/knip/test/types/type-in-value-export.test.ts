import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/types/type-in-value-export');

test('Find unused types in value exports (explicit and inferred returns)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.types['src/api.ts']['GetPointsResponse']);
  assert(issues.types['src/api.ts']['ScratchData']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 2,
    processed: 2,
    total: 2,
  });
});
