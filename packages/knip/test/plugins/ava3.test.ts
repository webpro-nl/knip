import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/ava3');

test('Find dependencies with the Ava plugin (3)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'test.js')));
  assert(issues.files.has(join(cwd, 'test.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 9,
    total: 9,
  });
});
