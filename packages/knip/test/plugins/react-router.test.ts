import { test } from 'bun:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const isWindows = os.platform() === 'win32';

test('Find dependencies with the react-router plugin', async () => {
  const cwd = resolve('fixtures/plugins/react-router');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 9,
    total: 9,
    // There is a bug with routes that include () on Windows so they will not be found there, revert when
    // the bug is fixed
    files: isWindows ? 1 : 0,
  });
});

test('Find dependencies with the react-router plugin [with custom server entry]', async () => {
  const cwd = resolve('fixtures/plugins/react-router-with-server-entry');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});
