import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/exports-value-refs-default');

test('Find unused exports in exported types (default)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['refs.ts']['logger']);
  assert(issues.types['refs.ts']['Lizard']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    types: 1,
    processed: 2,
    total: 2,
  });
});
