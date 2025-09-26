import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/re-exports-aliased-ns');

test('Find exports through re-exported aliased namespace', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['2-second.ts']['NS.second']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 5,
    total: 5,
  });
});
