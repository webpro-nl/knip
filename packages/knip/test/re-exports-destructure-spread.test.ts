import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/re-exports-destructure-spread');

test('Find exports through namespace, spread, destructure', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['animal.ts']['fly']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 4,
    total: 4,
  });
});

test('Find exports through namespace, spread, destructure (--include-libs)', async () => {
  const options = await createOptions({ cwd, isIncludeLibs: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['animal.ts']['fly']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 4,
    total: 4,
  });
});
