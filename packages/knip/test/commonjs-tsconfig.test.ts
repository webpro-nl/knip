import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/commonjs-tsconfig');

test('Support CommonJS-style imports and exports (w tsconfig.json)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['dir/exports.js']['unused']);
  assert(issues.exports['dir/mod1.js']['identifier']);
  assert(issues.exports['dir/mod1.js']['identifier2']);

  assert(issues.unlisted['dir/mod.js']['string-literal']);
  assert(issues.unlisted['dir/mod.js']['another-unlisted']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    unlisted: 2,
    processed: 6,
    total: 6,
  });
});
