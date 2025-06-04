import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/eleventy4');

// Uses a config file with default and `config` export. While this is not
// supported by the plugin, this test ensures that an error is not thrown.
test('Find dependencies with the Eleventy plugin (4)', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    // One file is found because the `config` export is not used, so the
    // default `config.dir.data` directory is used instead.
    files: 1,
    processed: 3,
    total: 3,
  });
});
