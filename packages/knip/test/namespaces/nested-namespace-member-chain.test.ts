import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/namespaces/nested-namespace-member-chain');

test('Track exports accessed through namespace member chains of any depth', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.exports['src/mammals.ts']), ['zoo.unusedMammal']);
  assert.deepEqual(Object.keys(issues.exports['src/felines.ts']), ['zoo.unusedFeline']);
  assert.deepEqual(Object.keys(issues.exports['src/big-cats.ts']), ['zoo.unusedBigCat']);
  assert.deepEqual(Object.keys(issues.exports['src/lions.ts']), ['zoo.unusedLion']);

  assert.deepEqual(Object.keys(issues.namespaceMembers['src/taxonomy.ts']), [
    'Animals.Mammals.Felines.BigCats.unusedPanther',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    namespaceMembers: 1,
    processed: 7,
    total: 7,
  });
});
