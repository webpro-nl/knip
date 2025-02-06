import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/tanstack-router4');

test('Find dependencies with the tanstack-router plugin (4)', async () => {
  const { /* issues, */ counters } = await main({
    ...baseArguments,
    cwd,
  });

  // console.log(issues);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 0,
    processed: 1,
    total: 1,
  });
});
