import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/ignore-unresolved2');

test('Respect ignored unresolved imports, including regex, show config hints', async () => {
  const { counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

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
