import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/workspace-export-fallback-array');

test('Map fallback-array workspace exports to their source files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['packages/library/src/index.ts']?.unused);
  assert(!issues.exports['packages/library/src/index.ts']?.used);
  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 2,
    total: 2,
  });
});
