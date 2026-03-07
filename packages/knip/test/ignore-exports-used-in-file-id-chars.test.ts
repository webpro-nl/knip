import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

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
