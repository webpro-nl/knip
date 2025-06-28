import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/xo');

test('Find dependencies with the xo plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['.xo-config.js']['eslint-plugin-unused-imports']);
  assert(issues.unlisted['xo.config.cjs']['glob']);
  assert(issues.unresolved['package.json']['eslint-plugin-eslint-comments']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    unlisted: 1,
    unresolved: 2,
    total: 2,
  });
});
