import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/script-visitors/execa');

test('Find dependencies with custom script visitors (execa)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['options.mjs']['hydrate.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 5,
    total: 5,
  });
});
