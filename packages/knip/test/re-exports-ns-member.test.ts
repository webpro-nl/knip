import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/re-exports-ns-member');

test('Find destructured props of member-accessed imported symbol', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['member-ab.ts']['NS.unusedMemberA']);
  assert(issues.exports['member-cd.ts']['pseudo.unusedMemberC']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 6,
    total: 6,
  });
});
