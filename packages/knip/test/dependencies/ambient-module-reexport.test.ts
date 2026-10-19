import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/ambient-module-reexport');

test('Find dependencies and files re-exported in an ambient module declaration', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.equal(Object.keys(issues.devDependencies['package.json']).length, 1);
  assert(issues.devDependencies['package.json']['unused-package']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 2,
    total: 2,
  });
});
