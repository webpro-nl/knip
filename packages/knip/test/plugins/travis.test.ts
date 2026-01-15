import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/travis');

test('Find dependencies with the travis plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['.travis.yml']['patch-version']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 0,
    total: 0,
  });
});
