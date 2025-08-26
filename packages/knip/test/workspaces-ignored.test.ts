import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces-ignored');

test('Ignore workspaces', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert.equal(Object.keys(issues.binaries).length, 2);
  assert(issues.binaries['packages/e/package.json']['not-ignored']);
  assert(issues.binaries['packages/production/package.json']['ignored-in-production-mode']);

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'ignoreWorkspaces', identifier: 'packages/not-found' },
      { type: 'ignoreWorkspaces', identifier: 'packages/production-not-found' },
      { type: 'ignoreWorkspaces', identifier: 'packages/wut/*' },
      { type: 'ignoreWorkspaces', identifier: 'packages/un/**/used' },
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 2,
  });
});

test('Ignore workspaces (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.binaries).length, 1);
  assert(issues.binaries['packages/e/package.json']['not-ignored']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
  });
});
