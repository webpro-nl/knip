import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = path.resolve('test/fixtures/workspaces-nested');

test('Find unused dependencies in nested workspaces with default config (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
  });

  assert(issues.unlisted['level-1-1/level-1-2/level-1-3/index.ts']['package-1-2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 6,
    total: 6,
  });
});

test('Find unused dependencies in nested workspaces with default config in production mode (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
    isProduction: true,
  });

  assert(issues.unlisted['level-1-1/level-1-2/level-1-3/index.ts']['package-1-2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 3,
    total: 3,
  });
});
