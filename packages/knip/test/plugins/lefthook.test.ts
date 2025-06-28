import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/lefthook');

test('Find dependencies with the Lefthook plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['lefthook.yml']['eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 1,
    total: 1,
  });
});
