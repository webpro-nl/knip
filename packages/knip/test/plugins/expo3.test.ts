import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/expo3');

test('Find dependencies with the Expo plugin (3)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
