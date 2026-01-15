import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/cross-workspace-inputs');

test('Assign binaries, dependencies and configuration files to the correct workspace', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Assign binaries, dependencies and configuration files to the correct workspace (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});
