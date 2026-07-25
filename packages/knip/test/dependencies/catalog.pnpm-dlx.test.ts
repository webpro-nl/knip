import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Should track catalog entries referenced through pnpm dlx scripts', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-pnpm-dlx');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.catalog['pnpm-workspace.yaml']), ['default.lodash', 'tools.unused']);
  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 2,
    processed: 0,
    total: 0,
  });
});
