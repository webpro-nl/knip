import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-exports-used-in-file-typeof-class');

test('Ignore exports used in file for typeof function and class references', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/api.ts']['TreeNode']);
  assert(issues.exports['src/api.ts']['TreeLeaf']);

  assert(!issues.exports['src/api.ts']?.['logger']);
  assert(!issues.exports['src/api.ts']?.['Leaf']);
  assert(!issues.exports['src/api.ts']?.['Node']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
