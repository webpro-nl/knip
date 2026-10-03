import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Report exports used in signatures of used exports', async () => {
  const cwd = resolve('fixtures/types/report-exports-used-in-signatures');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.types['src/api.ts']['FetchOptions']);
  assert(issues.types['src/api.ts']['FetchResult']);
  assert(issues.types['src/api.ts']['UnusedSpec']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 3,
    processed: 2,
    total: 2,
  });
});

test('Keep exports used in signatures of used exports alive by default', async () => {
  const cwd = resolve('fixtures/types/type-in-value-export');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.types['src/api.ts']?.['GetPoints']);
  assert(!issues.types['src/api.ts']?.['GetPointsParams']);
  assert(issues.types['src/api.ts']['GetPointsResponse']);
  assert(issues.types['src/api.ts']['ScratchData']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 2,
    processed: 2,
    total: 2,
  });
});
