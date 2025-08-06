import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Should track referenced catalog entries (package.json)', async () => {
  const cwd = resolve('fixtures/catalog-named-package-json');
  const { issues, counters } = await main({ ...baseArguments, cwd });

  assert(issues.catalog['package.json']['default.react']);
  assert(issues.catalog['package.json']['default.lodash']);
  assert(issues.catalog['package.json']['frontend.vue']);
  assert(issues.catalog['package.json']['frontend.nuxt']);
  assert(issues.catalog['package.json']['backend.express']);
  assert(issues.catalog['package.json']['backend.fastify']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 6,
    processed: 0,
    total: 0,
  });
});

test('Should track referenced catalog entries (package.json root)', async () => {
  const cwd = resolve('fixtures/catalog-named-package-json-root');
  const { issues, counters } = await main({ ...baseArguments, cwd });

  assert(issues.catalog['package.json']['default.react']);
  assert(issues.catalog['package.json']['default.lodash']);
  assert(issues.catalog['package.json']['frontend.vue']);
  assert(issues.catalog['package.json']['frontend.nuxt']);
  assert(issues.catalog['package.json']['backend.express']);
  assert(issues.catalog['package.json']['backend.fastify']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 6,
    processed: 0,
    total: 0,
  });
});
