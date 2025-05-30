import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-paths');

test('Find unused dependencies, exports and files in workspaces (w/ paths)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.keys(issues.unlisted).length, 1);
  assert(issues.unlisted['packages/lib-e/src/index.ts']['not']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 15,
    total: 15,
  });
});
