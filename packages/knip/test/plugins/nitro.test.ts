import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/nitro');

test('Find dependencies with the nitro plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['server/utils/fn.ts']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 3,
    total: 3,
  });
});
