import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

test('Should track referenced catalog entries (package.json)', async () => {
  const cwd = resolve('fixtures/catalog-named-package-json');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['package.json']['default.lodash']);
  assert(issues.catalog['package.json']['frontend.nuxt']);
  assert(issues.catalog['package.json']['backend.fastify']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 3,
    processed: 1,
    total: 1,
  });
});

test('Should track referenced catalog entries (package.json root)', async () => {
  const cwd = resolve('fixtures/catalog-named-package-json-root');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['package.json']['default.lodash']);
  assert(issues.catalog['package.json']['frontend.@nu/xt']);
  assert(issues.catalog['package.json']['backend.fastify']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 3,
    processed: 1,
    total: 1,
  });
});
