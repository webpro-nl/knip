import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/queue-dedup');

test('Shared modules reachable from multiple entries are not reported as unused', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('leaf.ts' in issues.files));
  assert(!('shared-a.ts' in issues.files));
  assert(!('shared-b.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});
