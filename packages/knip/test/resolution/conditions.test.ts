import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/conditions');

test('Resolve a subpath import using a custom condition', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.unresolved, {});
  assert.equal(issues.exports['src/feature.ts'].unusedFeature.symbol, 'unusedFeature');
  assert.equal(issues.exports['src/feature.ts'].feature, undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
    exports: 2,
  });
});
