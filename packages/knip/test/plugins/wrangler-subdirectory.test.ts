import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/wrangler-subdirectory');

test('Find the wrangler entry file relative to its config file', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['handler.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});
