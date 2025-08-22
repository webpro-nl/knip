import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/re-exports-destructure-spread');

test('Find exports through namespace, spread, destructure', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 4,
    total: 4,
  });
});

test('Find exports through namespace, spread, destructure (--include-libs)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeLibs: true,
  });

  assert(issues.exports['animal.ts']['fly']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 4,
    total: 4,
  });
});
