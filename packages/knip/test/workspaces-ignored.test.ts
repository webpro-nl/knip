import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces-ignored');

test('Ignore workspaces', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(issues.binaries['packages/e/package.json']['not-ignored']);
  assert(issues.binaries['packages/production/package.json']['ignored-in-production-mode']);
  assert(issues.binaries['packages/deep/unignored/package.json']['unignored']);

  assert.deepEqual(configurationHints, [
    { type: 'ignoreWorkspaces', identifier: 'packages/not-found' },
    { type: 'ignoreWorkspaces', identifier: 'packages/production-not-found' },
    { type: 'ignoreWorkspaces', identifier: 'packages/un/**/used' },
    { type: 'ignoreWorkspaces', identifier: 'packages/wut/*' },
  ]);

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
