import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/lit');

test('Credit custom elements registered via Lit @customElement', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const flagged = new Set(Object.values(issues.exports).flatMap(byId => Object.keys(byId)));

  // Decorator forms, validated against a `lit/decorators` import:
  assert(!flagged.has('MyElement')); // bare import, `export class`
  assert(!flagged.has('SeparateElement')); // decorator + separate `export { … }`
  assert(!flagged.has('AliasedElement')); // `import { customElement as ce }`
  assert(!flagged.has('NamespaceElement')); // `@decorators.customElement(…)`
  assert(!issues.exports['anonymous-element.ts']?.default); // anonymous default class
  assert(!flagged.has('AliasedExportElement')); // decorated class exported under an alias

  // A genuinely unused sibling export is still flagged (only the class is credited):
  assert.equal(issues.exports['my-element.ts'].unusedHelper.symbol, 'unusedHelper');

  // Negatives — these must still be reported:
  assert.equal(issues.exports['not-lit-element.ts'].NotLitElement.symbol, 'NotLitElement'); // local customElement
  assert.equal(issues.exports['imported-non-lit-element.ts'].ImportedNonLitElement.symbol, 'ImportedNonLitElement'); // non-Lit import
  assert.equal(issues.exports['scoped-collision-element.ts'].ScopedBadge.symbol, 'ScopedBadge'); // function-local decorated class

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    processed: 11,
    total: 11,
  });
});
