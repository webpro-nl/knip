import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/expo3');

test('Find dependencies with the Expo plugin (3)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['app.json']['expo-router']);
  assert(issues.unlisted['app.json']['react-native-ble-plx']);

  assert(issues.dependencies['package.json']['@expo/metro-runtime']);
  assert(issues.dependencies['package.json']['expo-system-ui']);
  assert(issues.dependencies['package.json']['expo-updates']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
    unlisted: 2,
    dependencies: 3,
  });
});
