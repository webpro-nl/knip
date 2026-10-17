import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/basic');

test('Support various ways to import modules', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 30,
    total: 30,
  });

  assert.deepEqual(Object.keys(issues.exports['promise-all-top-level.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['promise-all-scoped.ts']), ['unused']);
});
