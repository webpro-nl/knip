import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/eve-workspace');

test('Find files in nested and flat Eve workspace members', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'agents/research/extensions/search/lib/unused.ts',
    'agents/support/agent/extensions/search/lib/unused.ts',
  ]);

  assert(!issues.dependencies['package.json']?.eve);
  assert(issues.dependencies['package.json']['stale-support-client']);
  assert(issues.dependencies['package.json']['stale-research-client']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    dependencies: 2,
    processed: 25,
    total: 25,
  });
});
