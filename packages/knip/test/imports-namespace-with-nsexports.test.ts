import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/imports-namespace-with-nsexports');

test("Don't ignore namespace re-export by entry file (nsExports)", async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    nsExports: 8,
    unlisted: 1,
    processed: 8,
    total: 8,
  });
});
