import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/sveltekit');

test('Find dependencies with the SvelteKit plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 18,
    total: 18,
  });
});

test('Find dependencies with the SvelteKit plugin (development)', async () => {
  const options = await createOptions({ cwd, isProduction: false });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['svelte']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 20,
    total: 20,
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

test('Find dependencies with the SvelteKit plugin (config in vite.config)', async () => {
  const cwd3 = resolve('fixtures/plugins/sveltekit-vite-config');
  const options = await createOptions({ cwd: cwd3, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 7,
    total: 7,
  });
});

test('Find dependencies with the SvelteKit plugin (config in vite.config takes precedence over svelte.config.js)', async () => {
  const cwd4 = resolve('fixtures/plugins/sveltekit-config-precedence');
  const options = await createOptions({ cwd: cwd4, isProduction: true });
  const { issues, counters } = await main(options);

  assert('legacy/helper.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 4,
    total: 4,
  });
});
