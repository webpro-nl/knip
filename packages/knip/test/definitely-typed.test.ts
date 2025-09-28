import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/definitely-typed');

test('Find unused DT @types', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['@types/unused']);
  assert(issues.devDependencies['package.json']['@types/mocha']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    processed: 1,
    total: 1,
  });
});

test('Find type imports in production dependencies (strict)', async () => {
  const options = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['type-only-production-types']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});
