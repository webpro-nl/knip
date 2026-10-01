import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('import resolved transitively via a declared peer is not flagged unlisted', async () => {
  const cwd = resolve('fixtures/dependencies/peer-transitive');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.unlisted['packages/consumer/src/index.ts']?.['transitive-peer']);
  assert(issues.unlisted['packages/consumer/src/index.ts']?.['uninstalled-peer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});

test('strict mode still flags transitive-peer imports as unlisted', async () => {
  const cwd = resolve('fixtures/dependencies/peer-transitive');
  const options = await createOptions({ cwd, isStrict: true, isProduction: false });
  const { issues } = await main(options);

  assert(issues.unlisted['packages/consumer/src/index.ts']?.['transitive-peer']);
  assert(issues.unlisted['packages/consumer/src/index.ts']?.['uninstalled-peer']);
});
