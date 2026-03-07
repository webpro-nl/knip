import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nuxt');

test('Find dependencies with the nuxt plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['vue']);
  assert(issues.dependencies['package.json']['@pinia/nuxt']);
  assert(issues.dependencies['package.json']['@nuxt/eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    dependencies: 3,
    processed: 4,
    total: 4,
  });
});
