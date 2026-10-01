import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/fast');

test('Credit FAST elements registered via @customElement or static define()', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const flagged = new Set(Object.values(issues.exports).flatMap(byId => Object.keys(byId)));

  // FAST @customElement, validated against an @microsoft/fast-element import:
  assert(!flagged.has('MyFastElement')); // string arg
  assert(!flagged.has('ConfigFastElement')); // object arg (`{ name: … }`)

  // FAST's static define() on a FASTElement subclass (its documented registration):
  assert(!flagged.has('DefineElement')); // El.define('tag')
  assert(!flagged.has('DefineConfigElement')); // El.define({ name })
  assert(!flagged.has('AliasedBaseElement')); // import { FASTElement as FastBase }
  assert(!flagged.has('DefineAsyncElement')); // El.defineAsync({ name }) (SSR registration)
  assert(!flagged.has('MixinElement')); // extends Renderable(FASTElement) mixin + defineAsync

  // A genuinely unused sibling export is still flagged (only the class is credited):
  assert.equal(issues.exports['my-fast-element.ts'].unusedHelper.symbol, 'unusedHelper');

  // Negatives — these must still be reported:
  // a locally-defined `customElement` decorator (no import),
  assert.equal(issues.exports['not-fast-element.ts'].NotFastElement.symbol, 'NotFastElement');
  // a `customElement` imported from a non-FAST module,
  assert.equal(issues.exports['imported-non-fast-element.ts'].ImportedNonFastElement.symbol, 'ImportedNonFastElement');
  // a FASTElement subclass that is never registered,
  assert.equal(issues.exports['unregistered-element.ts'].UnregisteredElement.symbol, 'UnregisteredElement');
  // a non-FASTElement class with a `.define()` call (define alone doesn't credit),
  assert.equal(issues.exports['plain-define.ts'].PlainModel.symbol, 'PlainModel');
  // a block-scoped FASTElement subclass does not credit a same-named module export,
  assert.equal(issues.exports['scoped-define-element.ts'].ScopedDefine.symbol, 'ScopedDefine');
  // and a class passed as an argument to `.define()` is not credited (e.g. HTMLDirective.define(X)).
  assert.equal(issues.exports['directive-define.ts'].TemplateDirective.symbol, 'TemplateDirective');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 7,
    processed: 15,
    total: 15,
  });
});
