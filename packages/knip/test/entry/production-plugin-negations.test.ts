import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/production-plugin-negations');

test('Preserve production files excluded from plugin development entries', async () => {
  const development = await main(await createOptions({ cwd, isIncludeEntryExports: true }));

  assert.deepEqual(development.issues.exports, {});
  assert.deepEqual(development.counters, { ...baseCounters, processed: 2, total: 2 });

  const production = await main(await createOptions({ cwd, isProduction: true, isIncludeEntryExports: true }));

  assert(production.issues.exports['src/generated/client.ts']?.createClient);
  assert.deepEqual(production.counters, { ...baseCounters, exports: 1, processed: 1, total: 1 });
});
