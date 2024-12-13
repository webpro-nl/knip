import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Trace', async () => {
  const cwd = resolve('fixtures/trace');

  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  // TODO Should either get traces from main or assert stdout output through cli

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});
