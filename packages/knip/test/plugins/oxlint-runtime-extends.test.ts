import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Resolve lint extends and local plugins relative to each original config file', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/oxlint-runtime-extends') });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.values(issues.devDependencies).flatMap(Object.keys), []);
  assert(issues.unlisted['configs/shared.json']['eslint-plugin-runtime-missing']);
  assert(issues.unlisted['local-plugin.ts']['eslint-plugin-local-runtime']);
  assert(issues.unlisted['configs/extended-plugin.ts']['eslint-plugin-extended-runtime']);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
    unlisted: 3,
  });
});
