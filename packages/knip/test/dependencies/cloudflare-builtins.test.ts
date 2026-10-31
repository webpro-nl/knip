import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Ignore cloudflare: built-in modules, but not the cloudflare package', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/dependencies/cloudflare-builtins') });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.unlisted, {});
  assert(issues.dependencies['package.json']['cloudflare']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Report the cloudflare package as unlisted, but not cloudflare: built-in modules', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/dependencies/cloudflare-package') });
  const { issues, counters } = await main(options);

  const unlisted = issues.unlisted['index.js'] ?? {};
  assert(unlisted['cloudflare']);
  assert(!Object.keys(unlisted).some(name => name.startsWith('cloudflare:')));

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});
