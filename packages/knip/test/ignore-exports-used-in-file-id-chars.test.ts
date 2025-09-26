import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-exports-used-in-file-id-chars');

test('Find unused exports respecting an ignoreExportsUsedInFile boolean', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.exports['imported.ts']['unusedFunction'].symbol, 'unusedFunction');
  assert.equal(issues.exports['imported.ts']['unusedVar'].symbol, 'unusedVar');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
