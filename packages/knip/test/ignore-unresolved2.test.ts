import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-unresolved2');

test('Respect ignored unresolved imports, including regex, show config hints', async () => {
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'ignoreUnresolved', workspaceName: '.', identifier: 'unused-top-level' },
      { type: 'ignoreUnresolved', workspaceName: '.', identifier: 'unused-root' },
      { type: 'ignoreUnresolved', workspaceName: 'packages/client', identifier: 'unused-workspace' },
      { type: 'ignoreUnresolved', workspaceName: '.', identifier: './unresolved-workspace' },
    ])
  );
});
