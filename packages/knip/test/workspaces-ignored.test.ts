import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-ignored');

test('Ignore workspaces', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

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
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.equal(Object.keys(issues.binaries).length, 1);
  assert(issues.binaries['packages/e/package.json']['not-ignored']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
  });
});
