import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/msw');

test('Should not see the msw files in issues', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    total: 4,
    processed: 4,
  });
});
