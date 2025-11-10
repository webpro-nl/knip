import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces-ignored');

test('Ignore workspaces', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(issues.binaries['packages/e/package.json']['not-ignored']);
  assert(issues.binaries['packages/production/package.json']['ignored-in-production-mode']);
  assert(issues.binaries['packages/deep/unignored/package.json']['unignored']);

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
    binaries: 3,
  });
});

test('Ignore workspaces (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(issues.binaries['packages/e/package.json']['not-ignored']);
  assert(issues.binaries['packages/deep/unignored/package.json']['unignored']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 2,
  });
});
