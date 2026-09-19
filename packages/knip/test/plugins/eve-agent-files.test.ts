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

  for (const file of [
    'agent/lib/unused.ts',
    'agent/extensions/support/lib/unused.ts',
    'agent/extensions/support/subagents/reviewer/lib/unused.ts',
    'agent/extensions/support/subagents/reviewer/channels/webhook.ts',
    'agent/subagents/researcher/extensions/search/lib/unused.ts',
    'agent/subagents/researcher/extensions/search/memory.ts',
    'agent/subagents/researcher/channels/slack.ts',
    'agent/subagents/researcher/instrumentation.ts',
    'agent/subagents/researcher/schedules/daily.ts',
  ]) {
    assert(file in issues.files);
  }

  for (const file of [
    'agent/agent.ts',
    'agent/instructions/brief.ts',
    'agent/instrumentation/audit.ts',
    'agent/extensions/crm.ts',
    'agent/extensions/support/extension.ts',
    'agent/extensions/support/tools/search.ts',
    'agent/extensions/support/lib/used.ts',
    'agent/extensions/support/instructions/brief.ts',
    'agent/extensions/support/channels/webhook.ts',
    'agent/extensions/support/connections/crm.ts',
    'agent/extensions/support/hooks/audit.ts',
    'agent/extensions/support/skills/search.ts',
    'agent/extensions/support/schedules/daily.ts',
    'agent/extensions/support/subagents/remote.ts',
    'agent/extensions/support/subagents/reviewer/agent.ts',
    'agent/extensions/support/subagents/reviewer/memory/profile.ts',
    'agent/extensions/support/subagents/reviewer/sandbox/sandbox.ts',
    'agent/extensions/support/subagents/reviewer/sandbox/workspace/bootstrap.ts',
    'agent/extensions/support/subagents/reviewer/tools/review.ts',
    'agent/extensions/support/subagents/reviewer/subagents/assistant/agent.ts',
    'agent/extensions/support/subagents/reviewer/extensions/lookup.ts',
    'agent/memory/profile.ts',
    'agent/sandbox/sandbox.ts',
    'agent/sandbox/workspace/bootstrap.ts',
    'agent/subagents/remote.ts',
    'agent/subagents/researcher/agent.ts',
    'agent/subagents/researcher/instructions/brief.ts',
    'agent/subagents/researcher/extensions/crm.ts',
    'agent/subagents/researcher/extensions/search/extension.ts',
    'agent/subagents/researcher/extensions/search/instructions.ts',
    'agent/subagents/researcher/extensions/search/tools/search.ts',
    'agent/subagents/researcher/extensions/search/lib/used.ts',
    'agent/subagents/researcher/extensions/search/subagents/reviewer/agent.ts',
    'agent/subagents/researcher/memory/profile.ts',
    'agent/subagents/researcher/sandbox/sandbox.ts',
    'agent/subagents/researcher/sandbox/workspace/bootstrap.ts',
    'agent/subagents/researcher/subagents/remote.ts',
    'agent/subagents/researcher/tools/search.ts',
    'evals/evals.config.ts',
    'evals/smoke.eval.ts',
  ]) {
    assert(!(file in issues.files));
  }

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
