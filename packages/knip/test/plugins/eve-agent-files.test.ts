import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/eve-agent-files');

test('Find files with the current Eve agent conventions', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'agent/extensions/support/lib/unused.ts',
    'agent/extensions/support/subagents/reviewer/channels/webhook.ts',
    'agent/extensions/support/subagents/reviewer/lib/unused.ts',
    'agent/lib/unused.ts',
    'agent/subagents/researcher/channels/slack.ts',
    'agent/subagents/researcher/extensions/search/lib/unused.ts',
    'agent/subagents/researcher/extensions/search/memory.ts',
    'agent/subagents/researcher/instrumentation.ts',
    'agent/subagents/researcher/schedules/daily.ts',
  ]);

  assert(!issues.dependencies['package.json']?.eve);
  assert(issues.dependencies['package.json']['stale-client']);
  assert(issues.dependencies['package.json']['stale-subagent-client']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 9,
    dependencies: 2,
    processed: 49,
    total: 49,
  });
});
