import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/yorkie');

test('Find dependencies with the yorkie plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['lint-staged']);
  assert(issues.binaries['package.json']['eslint']);
  assert(issues.binaries['package.json']['markdownlint']);
  assert(issues.binaries['package.json']['svgo']);
  assert(issues.binaries['package.json']['lint-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 4,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});
