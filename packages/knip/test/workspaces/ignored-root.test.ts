import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/ignored-root');

test('Apply top-level ignores to workspaces when root workspace is ignored', async () => {
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'ignoreDependencies', workspaceName: '.', identifier: 'unused-ignore-dependency' },
    { type: 'ignoreBinaries', workspaceName: '.', identifier: 'unused-ignore-binary' },
    { type: 'ignoreUnresolved', workspaceName: '.', identifier: 'unused-ignore-unresolved' },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
