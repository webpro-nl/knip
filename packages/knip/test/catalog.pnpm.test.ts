import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Should track referenced default catalog entries', async () => {
  const cwd = resolve('fixtures/catalog-pnpm');
  const { issues, counters } = await main({ ...baseArguments, cwd });

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 1,
    processed: 1,
    total: 1,
  });
});

test('Should track referenced named catalog entries', async () => {
  const cwd = resolve('fixtures/catalog-named');

  const { issues, counters } = await main({ ...baseArguments, cwd });

  assert(issues.catalog['pnpm-workspace.yaml']['default.react']);
  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);
  assert(issues.catalog['pnpm-workspace.yaml']['frontend.vue']);
  assert(issues.catalog['pnpm-workspace.yaml']['frontend.nuxt']);
  assert(issues.catalog['pnpm-workspace.yaml']['backend.express']);
  assert(issues.catalog['pnpm-workspace.yaml']['backend.fastify']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 6,
    processed: 0,
    total: 0,
  });
});
