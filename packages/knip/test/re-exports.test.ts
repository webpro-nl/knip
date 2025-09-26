import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/re-exports');

test('Ignore re-exports from entry files', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Ignore re-exports from entry files (include entry + ignore @public)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['1-entry.ts']['somethingNotToIgnore']);
  assert(issues.exports['3-re-export-named.ts']['somethingNotToIgnore']);
  assert(issues.exports['4-my-module.ts']['somethingNotToIgnore']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 4,
    total: 4,
  });
});
