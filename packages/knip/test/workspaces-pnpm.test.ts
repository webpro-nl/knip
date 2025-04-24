import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Find unused dependencies, exports and files in workspaces (loose)', async () => {
  const cwd = resolve('fixtures/workspaces-pnpm');
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.keys(issues.unlisted).length, 1);
  assert(issues.unlisted['apps/a/index.ts']['unlisted']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 4,
    total: 4,
  });
});
