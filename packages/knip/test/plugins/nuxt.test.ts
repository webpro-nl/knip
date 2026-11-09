import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nuxt');

test('Find dependencies with the Nuxt plugin without a config file', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['vue']);
  assert(issues.exports['utils/fn.ts']['unused']);
  assert('plugins/helpers/unused.js' in issues.files);
  assert('middleware/helpers/unused.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    exports: 1,
    files: 2,
    processed: 13,
    total: 13,
  });
});
