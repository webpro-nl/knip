import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces-root');

test('Exclude root workspace with !. selector', async () => {
  const options = await createOptions({ cwd, workspace: '!.' });
  const { issues, counters, selectedWorkspaces } = await main(options);

  assert(!selectedWorkspaces?.includes('.'));
  assert(selectedWorkspaces?.includes('app'));
  assert(issues.unlisted['app/index.ts']['vanilla-js']);
  assert(issues.unlisted['app/tsconfig.json']['@fixtures/workspaces__tsconfig']);
  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    processed: 2,
    total: 2,
  });
});

test('Select only root workspace with . selector', async () => {
  const options = await createOptions({ cwd, workspace: '.' });
  const { issues, counters, selectedWorkspaces } = await main(options);

  assert(selectedWorkspaces?.includes('.'));
  assert(!selectedWorkspaces?.includes('app'));
  assert(issues.unlisted['scripts/index.ts']['js-yaml']);
  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 1,
    binaries: 1,
    processed: 1,
    total: 1,
  });
});
