import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/ignore-unresolved');

test('Respect ignored unresolved imports, including regex, show config hints', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['index.ts']['missing-module']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 2,
    total: 2,
  });

  assert.deepEqual(
    configurationHints,
    new Set([{ type: 'ignoreUnresolved', workspaceName: '.', identifier: 'unused-ignore' }])
  );
});
