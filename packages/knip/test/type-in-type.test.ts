import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/type-in-type');

test('Flag exported types referenced only inside other exported types (per tsc semantics)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['module.ts']['create']);
  assert(issues.types['types.ts']['Func']);

  assert(issues.types['types.ts']['A']);
  assert(issues.types['types.ts']['B']);
  assert(!issues.types['types.ts']?.['Wrapped']);
  assert(!issues.types['types.ts']?.['Mapped']);
  assert(!issues.types['types.ts']?.['Tuple']);
  assert(!issues.types['types.ts']?.['Intersection']);
  assert(!issues.types['types.ts']?.['Conditional']);
  assert(!issues.types['types.ts']?.['Nested']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    types: 3,
    processed: 3,
    total: 3,
  });
});
