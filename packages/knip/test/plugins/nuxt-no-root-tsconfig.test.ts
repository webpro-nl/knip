import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nuxt-no-root-tsconfig');

test('Resolve nuxt aliases without a root tsconfig.json', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 8,
    total: 8,
  });
});

test('Resolve local nuxt modules in production mode', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 6,
    total: 6,
  });
});

test('Classify package nuxt modules as production dependencies in strict mode', async () => {
  const options = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 6,
    total: 6,
  });
  assert.deepEqual(Object.keys(issues.unlisted['nuxt.config.ts']), ['nuxt-module']);
});
