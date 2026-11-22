import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/expo');

test('Find dependencies with the Expo plugin (1)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['expo-router']);
  assert('plugins/withUnused.js' in issues.files);
  assert(!('plugins/withAndroidManifest.js' in issues.files));
  assert(!('plugins/withIosEntitlements.ts' in issues.files));
  assert(!('plugins/withAbsolute.js' in issues.files));
  assert(!('plugins/withFunction.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 7,
    total: 7,
    files: 1,
    dependencies: 1,
  });
});
