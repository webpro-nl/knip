import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-unresolved');

test('Respect ignored unresolved imports, including regex, show config hints', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

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
