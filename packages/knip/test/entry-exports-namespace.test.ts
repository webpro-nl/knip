import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/entry-exports-namespace');

test('Find unused member on namespace re-exported in entry file', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Find unused member on namespace re-exported in entry file (2)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['index.ts'].NS);
  assert(issues.exports['ns.ts'].y);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 4,
    total: 4,
  });
});
