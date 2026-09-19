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

  for (const agentRoot of ['agents/support/agent', 'agents/research']) {
    assert(`${agentRoot}/extensions/search/lib/unused.ts` in issues.files);
    for (const file of ['extension.ts', 'tools/search.ts', 'lib/used.ts']) {
      assert(!(`${agentRoot}/extensions/search/${file}` in issues.files));
    }
  }

  for (const file of [
    'agents/support/agent/agent.ts',
    'agents/support/agent/instructions/brief.ts',
    'agents/support/agent/instrumentation/audit.ts',
    'agents/support/agent/extensions/crm.ts',
    'agents/support/agent/memory/profile.ts',
    'agents/support/agent/sandbox/sandbox.ts',
    'agents/support/agent/sandbox/workspace/bootstrap.ts',
    'agents/support/agent/subagents/remote.ts',
    'agents/support/agent/subagents/researcher/agent.ts',
    'agents/support/agent/tools/respond.ts',
    'agents/support/evals/evals.config.ts',
    'agents/support/evals/smoke.eval.ts',
    'agents/research/agent.ts',
    'agents/research/instructions/brief.ts',
    'agents/research/tools/search.ts',
    'agents/research/evals/evals.config.ts',
    'agents/research/evals/smoke.eval.ts',
  ]) {
    assert(!(file in issues.files));
  }

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
