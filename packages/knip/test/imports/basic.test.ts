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
    exports: 4,
    processed: 34,
    total: 34,
  });

  assert.deepEqual(Object.keys(issues.exports['promise-all-top-level.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['promise-all-scoped.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['then-member.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['then-destructure.ts']), ['unused']);
  assert.equal(issues.exports['promise-all-spread-namespace.ts'], undefined);
  assert.equal(issues.exports['promise-all-spread-named.ts'], undefined);
});
