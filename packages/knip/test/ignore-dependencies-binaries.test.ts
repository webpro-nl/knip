import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/ignore-dependencies-binaries');

test('Respect ignored binaries and dependencies, including regex, show config hints', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['package.json']['formatter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 2,
    total: 2,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'ignoreBinaries', workspaceName: '.', identifier: /.*unused-bins.*/ },
      { type: 'ignoreDependencies', workspaceName: '.', identifier: 'stream' },
      { type: 'ignoreDependencies', workspaceName: '.', identifier: /.+unused-deps.+/ },
    ])
  );
});

test('Respect ignored binaries and dependencies, including regex, no config hints (production)', async () => {
  const { counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });

  assert.deepEqual(configurationHints, new Set());
});
