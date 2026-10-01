import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/language/custom-elements');

test('Credit custom elements registered via customElements.define', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const flagged = new Set(Object.values(issues.exports).flatMap(byId => Object.keys(byId)));

  // Native customElements.define (web standard, no framework dependency):
  assert(!flagged.has('NativeElement'));
  assert(!flagged.has('WindowElement')); // window.customElements.define(…)
  assert(!flagged.has('GlobalElement')); // globalThis.customElements.define(…)
  assert(!flagged.has('SelfElement')); // self.customElements.define(…)

  // Registries beyond the bare global — static-block self-register, scoped instance, shadow-root, alias:
  assert(!flagged.has('StaticBlockElement')); // static { customElements.define('x', this) }
  assert(!flagged.has('ScopedRegistryElement')); // new CustomElementRegistry().define('x', El)
  assert(!flagged.has('ShadowRootElement')); // root.customElements.define('x', El)
  assert(!flagged.has('AliasedRegistryElement')); // const ce = customElements; ce.define('x', El)

  // A registered class exported under an alias is credited (export { X as Y } / as default):
  assert(!flagged.has('AliasedDefineElement'));
  assert(!issues.exports['default-alias-element.ts']?.default);

  // A type referenced only by a registered class's public signature stays alive (DTS chain):
  assert(!flagged.has('DtsChainElement'));
  assert(!issues.types['dts-chain-element.ts']?.ElementConfig);

  // A genuinely unused sibling export is still flagged (only the class is credited):
  assert.equal(issues.exports['native-element.ts'].unusedHelper.symbol, 'unusedHelper');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 12,
    total: 12,
  });
});
