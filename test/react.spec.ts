import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';
import baseCounters from './fixtures/baseCounters.js';

test('Support JSX/TSX files', async () => {
  const workingDir = 'test/fixtures/react';

  const { counters } = await main({
    ...baseArguments,
    cwd: workingDir,
    workingDir,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
