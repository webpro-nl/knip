import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nuxt-shared');

test('Resolve a custom Nuxt shared directory through #shared', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.equal(issues.files['shared-custom/utils/value.ts'], undefined);
  assert.equal(issues.unresolved['server/api/index.ts']?.['#shared/utils/value'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    binaries: 1,
    processed: 3,
    total: 3,
  });
});
