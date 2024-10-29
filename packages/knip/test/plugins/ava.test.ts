import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/ava');

test('Find dependencies with the Ava plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['package.json']['ts-node/esm/transpile-only']);
  assert(issues.unresolved['ava.config.mjs']['tsconfig-paths/register']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
    processed: 1,
    total: 1,
  });
});
