import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/sst');

test('Find dependencies with the sst plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['handlers/other-auth.ts']['sst-auth-handler-dep']);
  assert(issues.unlisted['handlers/auth.ts']['sst-auth-dep']);
  assert(issues.unlisted['handlers/some-route.ts']['sst-some-dep']);
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
