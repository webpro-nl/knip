import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

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

  assert.deepEqual(configurationHints, [{ type: 'ignoreUnresolved', workspaceName: '.', identifier: 'unused-ignore' }]);
});
