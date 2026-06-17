import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/config-hints');

const byIdentifier = (a: { identifier: string | RegExp }, b: { identifier: string | RegExp }) =>
  String(a.identifier).localeCompare(String(b.identifier));

test('Report config hints for all workspaces', async () => {
  const options = await createOptions({ cwd });
  const { configurationHints } = await main(options);

  assert.deepEqual(configurationHints.sort(byIdentifier), [
    { type: 'ignoreDependencies', workspaceName: 'packages/a', identifier: 'unused-ignore-a' },
    { type: 'ignoreDependencies', workspaceName: 'packages/b', identifier: 'unused-ignore-b' },
    { type: 'ignoreDependencies', workspaceName: '.', identifier: 'unused-ignore-root' },
  ]);
});

test('Report config hints for the selected workspace only (--workspace)', async () => {
  const options = await createOptions({ cwd, workspace: 'packages/a' });
  const { configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'ignoreDependencies', workspaceName: 'packages/a', identifier: 'unused-ignore-a' },
  ]);
});

test('Report config hints for multiple selected workspaces (--workspace)', async () => {
  const options = await createOptions({ cwd, workspace: ['packages/a', 'packages/b'] });
  const { configurationHints } = await main(options);

  assert.deepEqual(configurationHints.sort(byIdentifier), [
    { type: 'ignoreDependencies', workspaceName: 'packages/a', identifier: 'unused-ignore-a' },
    { type: 'ignoreDependencies', workspaceName: 'packages/b', identifier: 'unused-ignore-b' },
  ]);
});

test('Do not report root config hints in scoped runs (--workspace .)', async () => {
  const options = await createOptions({ cwd, workspace: '.' });
  const { configurationHints } = await main(options);

  assert.deepEqual(configurationHints, []);
});
