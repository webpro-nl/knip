import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Should read catalogs from pnpm-workspace.yaml include files', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-pnpm-include');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['catalogs.pnpm-workspace.yaml']['default.lodash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 1,
    processed: 1,
    total: 1,
  });
});

test('Should keep catalog entries in their own file when split across include files', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-pnpm-include-split');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.catalog['pnpm-workspace.yaml']['default.lodash'].line, 7);
  assert.equal(issues.catalog['catalogs.pnpm-workspace.yaml']['react.react-dom'].line, 4);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 2,
    processed: 1,
    total: 1,
  });
});
