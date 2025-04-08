import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/entry-exports-enum-members');

test('Find unused exportd, types and enum members re-exported in entry file', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Find unused exportd, types and enum members re-exported in entry file (2)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert(issues.types['fruit.ts'].Farmer);
  assert(issues.exports['index.ts'].Farmer);
  assert(issues.exports['index.ts'].Tree);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    types: 1,
    processed: 4,
    total: 4,
  });
});
