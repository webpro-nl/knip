import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/type-in-type');

test('Find unused types but not types used in other exported types', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['module.ts']['create']);
  assert(issues.types['types.ts']['Func']);

  assert(!issues.types['types.ts']['B']);
  assert(!issues.types['types.ts']['A']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    types: 1,
    processed: 3,
    total: 3,
  });
});
