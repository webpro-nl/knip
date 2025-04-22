import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/nano-staged');

test('Find dependencies with the nano-staged plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['package.json']['eslint']);
  assert(issues.binaries['package.json']['prettier']);
  assert(issues.binaries['.nano-staged.js']['eslint']);
  assert(issues.binaries['.nano-staged.js']['prettier']);
  assert(issues.devDependencies['package.json']['nano-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 4,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Find dependencies with the nano-staged plugin (production)', async () => {
    const { counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});
