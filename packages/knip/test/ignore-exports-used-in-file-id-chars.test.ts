import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/ignore-exports-used-in-file-id-chars');

test('Find unused exports respecting an ignoreExportsUsedInFile boolean', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.exports['imported.ts']['unusedFunction'].symbol, 'unusedFunction');
  assert.equal(issues.exports['imported.ts']['unusedVar'].symbol, 'unusedVar');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
