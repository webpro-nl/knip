import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/package-entry-points-null-test-files');

test('Exclude test files unexported by a null package entry point (production)', async () => {
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
