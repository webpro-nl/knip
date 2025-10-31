import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/eleventy4');

// Uses a config file with default and `config` export. While this is not
// currently supported, this test ensures that an error is not thrown.
test('Find dependencies with the Eleventy plugin (4)', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    // One file is found because the `config` export is not used, so the
    // default `config.dir.data` directory is used instead.
    files: 1,
    processed: 3,
    total: 3,
  });
});
