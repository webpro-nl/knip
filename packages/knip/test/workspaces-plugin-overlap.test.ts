import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces-plugin-overlap');

test('Handles config file shared by multiple plugins in workspaces', async () => {
  const options = await createOptions({ cwd, isIsolateWorkspaces: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
  });
});
