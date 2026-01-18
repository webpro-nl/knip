import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/svelte');

test('Use compilers (svelte)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['svelte']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 18,
    total: 18,
  });
});
