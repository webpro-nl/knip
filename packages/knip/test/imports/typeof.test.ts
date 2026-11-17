import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/typeof');

test('Support typeof imports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['fruits.ts']['cherry']);
  assert(issues.namespaceMembers['fruits.ts']['Citrus.Lime']);
  assert(issues.namespaceMembers['vegetables.ts']['Roots.Beet']);
  assert(issues.enumMembers['vegetables.ts']['Color.Red']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    enumMembers: 1,
    namespaceMembers: 2,
    processed: 3,
    total: 3,
  });
});
