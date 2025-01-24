import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/expo');

test('Find dependencies with the Expo plugin (1)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['expo-router']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
    dependencies: 1,
  });
});
