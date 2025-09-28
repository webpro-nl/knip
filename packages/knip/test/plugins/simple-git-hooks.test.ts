import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/simple-git-hooks');

test('Find dependencies with the simple-git-hooks plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['package.json']['eslint']);
  assert(issues.binaries['package.json']['lint-staged']);
  assert(issues.devDependencies['package.json']['lint-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 2,
    devDependencies: 1,
  });
});
