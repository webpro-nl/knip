import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/dts-compiled');

test('Include compiled files referred by the declaration files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/UnusedQuery.graphql')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 8,
    total: 8,
  });
});
