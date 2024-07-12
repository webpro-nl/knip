import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/ladle');

test('Find dependencies with the ladle plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['@ladle/react']);
  assert(issues.dependencies['package.json']['react']);
  assert(issues.dependencies['package.json']['react-dom']);
  assert(issues.devDependencies['package.json']['@types/react']);
  assert(issues.devDependencies['package.json']['@types/react-dom']);
  assert(issues.binaries['package.json']['ladle']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    dependencies: 3,
    devDependencies: 2,
    processed: 0,
    total: 0,
  });
});
