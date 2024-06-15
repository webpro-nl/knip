import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/simple-git-hooks');

test('Find dependencies with the simple-git-hooks plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['package.json']['eslint']);
  assert(issues.binaries['package.json']['lint-staged']);
  assert(issues.devDependencies['package.json']['simple-git-hooks']);
  assert(issues.devDependencies['package.json']['lint-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 2,
    devDependencies: 2,
  });
});
