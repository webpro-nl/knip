import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/workspace-export-fallback-array');

test('Map fallback-array workspace exports to source in matching condition order', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.exports['packages/library/src/index.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['packages/library/src/conditional.ts']), ['conditionalUnused']);
  assert.deepEqual(Object.keys(issues.exports['packages/library/src/fallback.ts']), [
    'conditionalUsed',
    'fallbackUnused',
  ]);
  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    processed: 4,
    total: 4,
  });
});
