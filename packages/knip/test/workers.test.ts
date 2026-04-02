import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { createOptions } from '../src/util/create-options.ts';
import baseCounters from './helpers/baseCounters.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/workers');

test('Detect worker and fork entry files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.files).length, 1);
  assert('unused.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 5,
    total: 5,
  });
});
