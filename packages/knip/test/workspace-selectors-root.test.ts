import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces-root');

test('Exclude root workspace with !. selector', async () => {
  const options = await createOptions({ cwd, workspace: '!.' });
  const { issues, counters, selectedWorkspaces } = await main(options);

  assert(!selectedWorkspaces?.includes('.'));
  assert(selectedWorkspaces?.includes('app'));
  assert(issues.unlisted['app/index.ts']['vanilla-js']);
  assert(counters.unlisted === 1);
});

test('Select only root workspace with . selector', async () => {
  const options = await createOptions({ cwd, workspace: '.' });
  const { issues, counters, selectedWorkspaces } = await main(options);

  assert(selectedWorkspaces?.includes('.'));
  assert(!selectedWorkspaces?.includes('app'));
  assert(issues.unlisted['scripts/index.ts']['js-yaml']);
  assert(counters.unlisted === 1);
});
