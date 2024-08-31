import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/nuxt');

test('Find dependencies with the nuxt plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['vue']);
  assert(issues.exports['utils/fn.ts']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    exports: 1,
    processed: 3,
    total: 3,
  });
});
