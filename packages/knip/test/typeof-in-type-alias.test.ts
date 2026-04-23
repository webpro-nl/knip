import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/typeof-in-type-alias');

test('Flag values referenced only via typeof at the top of an exported type alias', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['schema.ts']['PRESETS']);
  assert(issues.exports['schema.ts']['DAYS']);

  assert(!issues.exports['schema.ts']?.['SHAPE']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
