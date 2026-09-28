import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/re-exports/excluded-tag');

test('Ignore re-exports with excluded tag from included entry files', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['index.ts']['somethingUnused']);
  assert(issues.exports['index.ts']['Button']);
  assert(issues.exports['module.ts']['somethingUnused']);
  assert(!issues.exports['module.ts']['apple']);
  assert(issues.exports['button.ts']['default']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    processed: 3,
    total: 3,
  });
});
