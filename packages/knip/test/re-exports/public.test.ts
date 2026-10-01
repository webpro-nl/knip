import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/re-exports/public');

test('Ignore re-exports from included entry files', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['index.ts']['Button']);
  assert(issues.exports['button.ts']['default']);
  assert(issues.exports['index.ts']['fruit']);
  assert(issues.exports['index.ts']['prune']);
  assert(issues.exports['barrel.ts']['prune']);
  assert(!issues.exports['module.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 5,
    processed: 4,
    total: 4,
  });
});
