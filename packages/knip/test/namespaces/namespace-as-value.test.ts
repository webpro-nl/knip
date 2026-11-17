import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/namespaces/namespace-as-value');

test('Treat namespace in default-exported object or return statement as used', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['nuts.ts']['nuts.almond']);
  assert(issues.exports['nuts.ts']['nuts.walnut']);
  assert(issues.exports['seeds.ts']['seeds.pumpkin']);
  assert(issues.exports['seeds.ts']['seeds.sesame']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    processed: 8,
    total: 8,
  });
});
