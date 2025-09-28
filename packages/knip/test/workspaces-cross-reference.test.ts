import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const cwd = resolve('fixtures/workspaces-cross-reference');

// In Bun, fg.glob returns lib-b before lib-a → circular ref gives different results when iterating principals
skipIfBun('Resolve imports in separate workspaces without entry file', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['packages/lib-a/mod-a.ts']['unused']);
  assert(issues.exports['packages/lib-b/mod-b.ts']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 4,
    total: 4,
  });
});
