import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/nx-crystal');

test('Find dependencies with the Nx plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
