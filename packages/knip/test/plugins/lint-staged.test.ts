import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/lint-staged');

test('Find dependencies with the lint-staged plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['package.json']['eslint']);
  assert(issues.binaries['package.json']['prettier']);
  assert(issues.binaries['.lintstagedrc.js']['eslint']);
  assert(issues.binaries['.lintstagedrc.js']['prettier']);
  assert(issues.devDependencies['package.json']['lint-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 4,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
