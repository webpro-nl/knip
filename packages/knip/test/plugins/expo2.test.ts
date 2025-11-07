import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/expo2');

test('Find dependencies with the Expo plugin (2)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['app.config.js']['expo-camera']);
  assert(issues.unlisted['app.config.js']['expo-system-ui']);
  assert(issues.unlisted['app.config.js']['expo-updates']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
    unlisted: 3,
  });
});
