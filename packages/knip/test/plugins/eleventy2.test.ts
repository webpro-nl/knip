import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/eleventy2');

test('Find dependencies with the Eleventy plugin (2)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['eleventy.config.cjs']['prismjs']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 2,
    total: 2,
  });
});
