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

  // `sherif` is referenced through `pnpm dlx sherif@catalog:` and must not be reported.
  assert.equal(issues.catalog['pnpm-workspace.yaml']?.['default.sherif'], undefined);

  // `lodash` is not referenced anywhere and must still be reported as unused.
  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 1,
    processed: 1,
    total: 1,
  });
});
