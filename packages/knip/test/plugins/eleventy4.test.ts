import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/eleventy4');

test('Find dependencies with the Eleventy plugin (4)', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  // This should report the same results as eleventy3, but the plugin does not
  // support the `config` export.
  assert.deepEqual(counters, {
    ...baseCounters,
  });
});
