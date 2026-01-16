import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/sveltekit');

test('Find dependencies with the SvelteKit plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 16,
    total: 16,
  });
});

test('Find dependencies with the SvelteKit plugin (development)', async () => {
  const options = await createOptions({ cwd, isProduction: false });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['svelte']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 18,
    total: 18,
  });
});

test('Find dependencies with the SvelteKit plugin (custom lib path)', async () => {
  const cwd2 = resolve('fixtures/plugins/sveltekit2');
  const options = await createOptions({ cwd: cwd2, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
