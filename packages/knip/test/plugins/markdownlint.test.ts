import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/markdownlint');

test('Find dependencies with the markdownlint plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['package.json']['markdownlint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 0,
    total: 0,
  });
});
