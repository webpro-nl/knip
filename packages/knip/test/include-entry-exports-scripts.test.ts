import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/include-entry-exports-scripts');

test('Skip unused exports in entry source files and scripts', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: false });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});

test('Report unused exports in source files (skip for scripts and plugin entry files)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 0, // skip for scripts and plugin entry files
    processed: 5,
    total: 5,
  });
});
