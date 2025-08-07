import { test } from 'bun:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const isWindows = os.platform() === 'win32';

test('Find dependencies with the react-router plugin', async () => {
  const cwd = resolve('fixtures/plugins/react-router');
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 9,
    total: 9,
    // There is a bug with routes that include () on Windows so they will not be found there, revert when
    // the bug is fixed
    files: isWindows ? 1 : 0,
  });
});

test('Find dependencies with the react-router plugin [with entries]', async () => {
  const cwd = resolve('fixtures/plugins/react-router-with-entries');
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 11,
    total: 11,
    // There is a bug with routes that include () on Windows so they will not be found there, revert when
    // the bug is fixed
    files: isWindows ? 1 : 0,
  });
});
