import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vite2');

test('Should not find issues with extensions when build_type is desktop', async () => {
  // Set build_type to desktop for this test
  process.env.build_type = 'desktop';
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 0,
    devDependencies: 2,
    unlisted: 0,
    processed: 3,
    total: 3,
  });
});
