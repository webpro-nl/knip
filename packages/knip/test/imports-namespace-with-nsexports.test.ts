import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/imports-namespace-with-nsexports');

test("Don't ignore namespace re-export by entry file (nsExports)", async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    nsExports: 8,
    unlisted: 1,
    processed: 8,
    total: 8,
  });
});
