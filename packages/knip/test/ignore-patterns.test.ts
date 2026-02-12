import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

test('Configuration hints for unused ignore patterns', async () => {
  const cwd = resolve('fixtures/ignore-patterns');
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'ignore', identifier: 'generated/**', workspaceName: undefined },
    { type: 'ignoreFiles', identifier: 'temp/**', workspaceName: undefined },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 3,
  });
});

test('Configuration hints for unused ignore patterns (monorepo)', async () => {
  const cwd = resolve('fixtures/ignore-patterns-monorepo');
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'ignore', identifier: 'build/**', workspaceName: undefined },
    { type: 'ignore', identifier: 'cache/**', workspaceName: 'packages/lib' },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 3,
  });
});
