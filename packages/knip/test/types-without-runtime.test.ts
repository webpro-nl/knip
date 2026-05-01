import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/types-without-runtime');

test('Report runtime imports as unlisted when only @types/X is installed', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['index.ts']?.orange);
  assert(!issues.unlisted['index.ts']?.banana);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});
