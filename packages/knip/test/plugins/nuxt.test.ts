import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/nuxt');

test('Find dependencies with the nuxt plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['vue']);
  // TODO:
  // assert(issues.exports['utils/fn.ts']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    dependencies: 3,
    exports: 0,
    processed: 4,
    total: 4,
  });
});
