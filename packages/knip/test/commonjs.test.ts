import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/commonjs');

test('Support CommonJS-style imports and exports (w/o tsconfig.json)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
