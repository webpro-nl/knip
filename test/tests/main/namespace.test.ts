import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../../src/index.js';
import baseArguments from '../../helpers/baseArguments.js';
import baseCounters from '../../helpers/baseCounters.js';

const cwd = 'test/fixtures/namespace';

test('Ignore namespace re-export by entry file', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Include namespace re-export by entry file', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    isIncludeEntryExports: true,
    cwd,
  });

  assert(issues.nsExports['my-module.ts']['myFunction']);

  assert.deepEqual(counters, {
    ...baseCounters,
    nsExports: 1,
    processed: 2,
    total: 2,
  });
});
