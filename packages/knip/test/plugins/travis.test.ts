import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/travis');

test('Find dependencies with the travis plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['.travis.yml']['patch-version']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 0,
    total: 0,
  });
});
