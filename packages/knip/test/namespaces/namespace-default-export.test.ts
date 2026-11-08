import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/namespaces/namespace-default-export');

test('Follow namespace re-exported as default export', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.exports['fruits.impl.ts']['Fruits.apple']);
  assert(issues.exports['fruits.impl.ts']['Fruits.banana']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 3,
    total: 3,
  });
});
