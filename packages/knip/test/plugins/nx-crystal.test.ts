import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nx-crystal');

test('Find dependencies with the Nx plugin (crystal)', async () => {
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
