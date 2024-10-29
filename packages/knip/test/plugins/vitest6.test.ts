import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest6');

test('Find dependencies with Vitest plugin (6)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/unused.test.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 4,
    total: 4,
  });
});
