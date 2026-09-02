import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/varlock');

test('Find dependencies with the varlock plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['.env.schema']['missing-plugin']);
  assert.deepEqual(Object.keys(issues.unlisted['.env.schema']), ['missing-plugin']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 2,
    total: 2,
  });
});
