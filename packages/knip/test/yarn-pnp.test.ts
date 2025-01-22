import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/yarn-pnp');

test('Find unused dependencies', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });
  
  console.log(issues, counters)

  assert(issues.dependencies['package.json']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 0,
    processed: 1,
    total: 1,
  });
});
