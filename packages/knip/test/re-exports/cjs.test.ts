import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/re-exports/cjs');

test('Ignore re-exports from entry files (CommonJS', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['3-my-module.js']['somethingReExported']);
  assert(issues.exports['3-my-module.js']['somethingElse']);
  assert(issues.exports['3-my-module.js']['somethingComputed']);
  assert(issues.exports['4-re-export-member.js']['somethingReExported']);
  assert(issues.exports['4-re-export-member.js']['somethingElse']);
  assert(issues.exports['4-re-export-member.js']['somethingComputed']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 6,
    processed: 4,
    total: 4,
  });
});
