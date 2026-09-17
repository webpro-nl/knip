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
    'agent/memory/profile.ts',
    'agent/sandbox/sandbox.ts',
    'agent/sandbox/workspace/bootstrap.ts',
    'agent/subagents/remote.ts',
    'agent/subagents/researcher/agent.ts',
    'agent/subagents/researcher/instructions/brief.ts',
    'agent/subagents/researcher/extensions/crm.ts',
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
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 22,
    total: 22,
  });
});
