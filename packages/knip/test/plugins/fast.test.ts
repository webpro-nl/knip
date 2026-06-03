import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/fast');

test('Credit FAST elements registered via @customElement', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const flagged = new Set(Object.values(issues.exports).flatMap(byId => Object.keys(byId)));

  // FAST @customElement, validated against an @microsoft/fast-element import:
  assert(!flagged.has('MyFastElement')); // string arg
  assert(!flagged.has('ConfigFastElement')); // object arg (`{ name: … }`)

  // A genuinely unused sibling export is still flagged (only the class is credited):
  assert.equal(issues.exports['my-fast-element.ts'].unusedHelper.symbol, 'unusedHelper');

  // Negatives — these must still be reported:
  // a locally-defined `customElement` decorator (no import),
  assert.equal(issues.exports['not-fast-element.ts'].NotFastElement.symbol, 'NotFastElement');
  // and a `customElement` imported from a non-FAST module.
  assert.equal(issues.exports['imported-non-fast-element.ts'].ImportedNonFastElement.symbol, 'ImportedNonFastElement');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 6,
    total: 6,
  });
});
