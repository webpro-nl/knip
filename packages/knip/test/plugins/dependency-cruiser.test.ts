import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/dependency-cruiser');

test('Find dependencies with the dependency-cruiser plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  // Check that dependencies are properly detected
  assert(issues.devDependencies['package.json']['dependency-cruiser']);
  assert(issues.binaries['package.json']['depcruise']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 1,
    processed: 2,
    total: 2,
  });
});
