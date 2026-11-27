import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/remotion');
const customEntryCwd = resolve('fixtures/plugins/remotion-custom-entry');

test('Find dependencies and entries with the Remotion plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files['src/unused.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 11,
    total: 11,
  });
});

test('Find dependencies and entries with the Remotion plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['src/bundler-helper.ts', 'src/unused.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 10,
    total: 10,
  });
});

test('Find custom entry points with Config.setEntryPoint in the Remotion plugin', async () => {
  const options = await createOptions({ cwd: customEntryCwd });
  const { issues, counters } = await main(options);

  assert(issues.files['remotion/index.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 5,
    total: 5,
  });
});
