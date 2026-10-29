import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/plugin-entry-ignored-workspace');

test('Keep plugin entry patterns with the dir of an ignored workspace out of it', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(issues.unlisted, {});

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
