import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mise-removed-task');

test('Report a dependency after its mise task is removed', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies['package.json'] ?? {}), ['eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});
