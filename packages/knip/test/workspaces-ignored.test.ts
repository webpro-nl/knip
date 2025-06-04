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

  assert.equal(Object.keys(issues.binaries).length, 1);
  assert(issues.binaries['packages/e/package.json']['not-ignored']);

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'project-empty', identifier: '[**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}!]', workspaceName: '.' },
      { type: 'project-empty', identifier: '[**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}!]', workspaceName: 'packages/e' },
      { type: 'ignoreWorkspaces', identifier: 'packages/not-found' },
      { type: 'ignoreWorkspaces', identifier: 'packages/wut/*' },
      { type: 'ignoreWorkspaces', identifier: 'packages/un/**/used' },
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
  });
});
