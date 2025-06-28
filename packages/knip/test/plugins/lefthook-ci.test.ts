import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/lefthook-ci');

test('Find dependencies with the Lefthook plugin (CI)', async () => {
  const CI = process.env.CI;
  process.env.CI = '1';

  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });

  process.env.CI = CI;
});
