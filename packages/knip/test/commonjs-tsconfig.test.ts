import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Support CommonJS-style imports and exports (w tsconfig.json)', async () => {
  const cwd = resolve('fixtures/commonjs-tsconfig');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

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
