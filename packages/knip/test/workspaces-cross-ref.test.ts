import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces-cross-ref');

test('Root scripts referencing files in child workspace are not false positives', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('scripts/generate.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
