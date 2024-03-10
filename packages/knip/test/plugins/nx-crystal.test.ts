import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/nx-crystal');

test('Find dependencies with the Nx plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@nx/cypress']);
  assert(issues.devDependencies['package.json']['@nrwl/workspace']);
  assert(issues.unlisted['nx.json']['@nx/nuxt']);
  assert(issues.binaries['package.json']['nx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 2,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});
