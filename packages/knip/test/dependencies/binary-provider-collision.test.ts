import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/binary-provider-collision');

test('Credit only packages that provide a referenced binary', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies['package.json'] ?? {}), ['custom-build-cli', 'other-build-cli']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    processed: 0,
    total: 0,
  });
});
