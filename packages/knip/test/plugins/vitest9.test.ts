import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest9');

test('Find dependencies in vitest configuration (projects with inline and external)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['vitest.config.ts']['jsdom']);
  assert(issues.unlisted['packages/client/vitest.config.e2e.ts']['happy-dom']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 0,
    devDependencies: 0,
    unlisted: 2,
    unresolved: 0,
    processed: 6,
    total: 6,
  });
});
