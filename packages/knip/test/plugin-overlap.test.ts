import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/plugin-overlap');

test('Handles config file shared by multiple plugins', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isIsolateWorkspaces: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
  });
});
