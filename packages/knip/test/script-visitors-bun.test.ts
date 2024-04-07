import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/script-visitors/bun');

test('Find dependencies with custom script visitors (bun)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['script.ts']['oh-my']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
    binaries: 1,
  });
});
