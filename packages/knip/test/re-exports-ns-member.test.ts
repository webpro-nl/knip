import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/re-exports-ns-member');

test('Find destructured props of member-accessed imported symbol', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['member-ab.ts']['NS.unusedMemberA']);
  assert(issues.exports['member-cd.ts']['pseudo.unusedMemberC']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 6,
    total: 6,
  });
});
