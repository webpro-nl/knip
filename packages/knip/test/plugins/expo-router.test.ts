import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/expo-router');

test('Find route entries with the Expo Router plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/app/unused.ts' in issues.files);

  assert(issues.dependencies['package.json']['@expo/metro-runtime']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 1,
    processed: 3,
    total: 3,
  });
});
