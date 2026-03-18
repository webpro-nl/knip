import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-plus');

test('Find dependencies with the vite-plus plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters, enabledPlugins } = await main(options);

  const plugins = enabledPlugins['.'];

  assert(plugins.includes('vite'));
  assert(plugins.includes('vitest'));
  assert(plugins.includes('tsdown'));
  assert(plugins.includes('oxfmt'));
  assert(plugins.includes('oxlint'));
  assert(plugins.includes('vite-plus'));

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});
