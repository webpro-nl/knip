import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Find imports from jsdoc @type tags', async () => {
  const cwd = resolve('fixtures/jsdoc');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['index.ts']['some-types']);
  assert(issues.unlisted['index.ts']['type-fest']);
  assert(issues.unlisted['index.ts']['more-types']);
  assert(issues.unlisted['index.ts']['@jest/types']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 4,
    processed: 1,
    total: 1,
  });
});
