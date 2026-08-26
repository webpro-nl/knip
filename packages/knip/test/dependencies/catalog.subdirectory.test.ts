import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Should resolve catalog references from a workspace subdirectory', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-subdirectory/pkg');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.catalog, {});
  assert.deepEqual(issues.catalogReferences, {});
  assert.equal(counters.catalog, 0);
  assert.equal(counters.catalogReferences, 0);
});
