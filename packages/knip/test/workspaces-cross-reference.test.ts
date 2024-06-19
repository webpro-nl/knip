import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const skipIf = typeof Bun !== 'undefined' ? test.skip : test;

const cwd = resolve('fixtures/workspaces-cross-reference');

skipIf('Resolve imports in separate workspaces without entry file', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['packages/lib-a/mod-a.ts']['unused']);
  assert(issues.exports['packages/lib-b/mod-b.ts']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 4,
    total: 4,
  });
});
