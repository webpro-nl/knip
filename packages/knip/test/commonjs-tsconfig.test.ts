import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/commonjs-tsconfig');

test('Support CommonJS-style imports and exports (w tsconfig.json)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['dir/exports.js']['unused']);
  assert(issues.exports['dir/script2.js']['identifier']);
  assert(issues.exports['dir/script2.js']['identifier2']);

  assert(issues.exports['dir/module1.ts']['unused']);
  assert(issues.exports['dir/module2.ts']['unused']);
  assert(issues.exports['dir/module3.js']['unused']);

  assert(issues.unlisted['dir/script1.js']['string-literal']);
  assert(issues.unlisted['dir/script1.js']['another-unlisted']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 6,
    unlisted: 2,
    processed: 10,
    total: 10,
  });
});
