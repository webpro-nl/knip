import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/remark');

test('Find dependencies with the Remark plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['remark-cli']);
  assert(issues.unresolved['package.json']['remark-preset-webpro']);
  assert(issues.binaries['package.json']['remark']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 1,
    unresolved: 1,
    processed: 0,
    total: 0,
  });
});
