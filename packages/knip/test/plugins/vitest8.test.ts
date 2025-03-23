import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest8');

test('Find dependencies with Vitest plugin (8)', async () => {
  const { counters, issues, report, rules } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['vitest.config.ts']['./vitest.integration.setup.mjs']);
  assert(issues.unresolved['vitest.config.ts']['./vitest.unit.setup.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 0,
    unresolved: 2,
    processed: 3,
    total: 3,
  });
});
