import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../src/index.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = path.resolve('test/fixtures/playwright');

test('Unused dependencies in playwright configuration', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 0,
    processed: 2,
    total: 2,
  });
});
