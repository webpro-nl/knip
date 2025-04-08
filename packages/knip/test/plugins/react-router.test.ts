import { test } from 'bun:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/react-router');

const skipIfWindows = os.platform() === 'win32' ? test.skip : test;

skipIfWindows('Find dependencies with the react-router plugin', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 9,
    total: 9,
  });
});
