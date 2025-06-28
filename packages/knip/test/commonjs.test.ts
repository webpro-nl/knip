import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/commonjs');

test('Support CommonJS-style imports and exports (w/o tsconfig.json)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['dir/exports.js']['unused']);
  assert(issues.exports['dir/mod1.js']['identifier2']);

  assert(issues.unlisted['index.js']['side-effects']);
  assert(issues.unlisted['index.js']['aliased-binding']);
  assert(issues.unlisted['index.js']['default-identifier']);
  assert(issues.unlisted['index.js']['named-object-binding']);
  assert(issues.unlisted['index.js']['no-substitution-tpl-literal']);
  assert(issues.unlisted['index.js']['string-literal-resolve']);
  assert(issues.unlisted['dir/mod.js']['string-literal']);
  assert(issues.unlisted['dir/mod.js']['another-unlisted']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    unlisted: 8,
    processed: 8,
    total: 8,
  });
});
