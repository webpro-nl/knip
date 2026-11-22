import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/tags-hints/configuration-hints-glob-key');

test('Provide configuration hints for glob workspace keys', async () => {
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'entry-empty', identifier: 'legacy.ts', workspaceName: 'packages/empty', configKey: 'packages/*' },
    {
      type: 'project-extension-excluded',
      identifier: '.svelte',
      workspaceName: 'packages/app',
      configKey: 'packages/*',
    },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 2,
    total: 2,
  });
});
