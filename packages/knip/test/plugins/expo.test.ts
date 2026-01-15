import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/expo');

test('Find dependencies with the Expo plugin (1)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['expo-router']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
    dependencies: 1,
  });
});
