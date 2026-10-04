import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/package-entry-points-test-files');

test('Include test files matched by package entry points', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/index.ts']['total']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 3,
    total: 3,
  });
});

test('Exclude test files matched by package entry points (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/index.ts']['total']);
  assert(issues.exports['src/math.ts']?.['subtract']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
