import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/metro-react-native');

test('Find dependencies with the Metro plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['react']);
  assert(issues.dependencies['package.json']['react-native']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    processed: 2,
    total: 2,
  });
});
