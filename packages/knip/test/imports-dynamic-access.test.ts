import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/imports-dynamic-access');

test('Support dynamic import module access', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['fruits.ts'].fig);
  assert(issues.exports['fruits.ts'].grape);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
