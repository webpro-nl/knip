import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/exports-value-refs');

test('Find unused exports in exported types', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['refs.ts']['NotInExportedType']);
  assert(issues.exports['refs.ts']['myValue']);
  assert(issues.exports['refs.ts']['myResult']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 2,
    total: 2,
  });
});
