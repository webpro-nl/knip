import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-until');

test('Ignore exports until date', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.exports['module.ts']?.['ignoredUntilFuture']);

  assert(issues.exports['module.ts']?.['ignoredUntilPast']);

  assert(issues.exports['module.ts']?.['ignoredUntilInvalid']);

  assert(issues.exports['module.ts']?.['regularUnused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 2,
    total: 2,
  });
});
