import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/sst');

test('Find dependencies with the sst plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['handlers/auth.handler.ts']['sst-auth-handler-dep']);
  assert(issues.unlisted['handlers/auth.ts']['sst-auth-dep']);
  assert(issues.unlisted['handlers/some-route-handler.ts']['sst-some-dep']);
  assert(issues.unlisted['stacks/AuthHandlerStack.ts']['sst-auth-handler-stack-dep']);
  assert(issues.unlisted['stacks/AuthStack.ts']['sst-auth-stack-dep']);
  assert(issues.unlisted['sst.config.ts']['sst-config-dep']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 6,
    processed: 6,
    total: 6,
  });
});
