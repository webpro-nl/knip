import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/entry-exports-enum-members');

test('Find unused exports, types and enum members re-exported in entry file', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Find unused exports, types and enum members re-exported in entry file (2)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

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
