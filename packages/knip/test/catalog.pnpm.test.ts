import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';

test('Should track referenced default catalog entries', async () => {
  const cwd = resolve('fixtures/catalog-pnpm');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);
  assert(issues.catalog['pnpm-workspace.yaml']['frontend.@nu/xt']);
  assert(issues.catalog['pnpm-workspace.yaml']['backend.fastify']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 3,
    processed: 1,
    total: 1,
  });
});
