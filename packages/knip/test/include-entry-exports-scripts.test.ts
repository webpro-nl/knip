import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/include-entry-exports-scripts');

test('Skip unused exports in entry source files and scripts', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: false,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});

test('Report unused exports in source files (skip for scripts and plugin entry files)', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 0, // skip for scripts and plugin entry files
    processed: 5,
    total: 5,
  });
});
