import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/script-visitors-execa');

test('Find dependencies with custom script visitors (execa)', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  // Let's start out conservatively
  // assert(issues.unresolved['options.mjs']['hydrate.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 6,
    total: 6,
  });
});
