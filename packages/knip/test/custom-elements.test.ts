import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/custom-elements');

test('Credit custom elements registered via customElements.define / static Class.define', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const flagged = new Set(Object.values(issues.exports).flatMap(byId => Object.keys(byId)));

  // Native customElements.define (web standard, no framework dependency):
  assert(!flagged.has('NativeElement'));
  assert(!flagged.has('WindowElement')); // window.customElements.define(…)

  // Static <Class>.define('tag') convention (Shoelace / Web Awesome / FAST base classes):
  assert(!flagged.has('StaticWidget')); // string tag
  assert(!issues.exports['static-card.ts']?.default); // default-exported class
  assert(!flagged.has('StaticConfig')); // object form `.define({ name })`

  // A registered class exported under an alias is credited (export { X as Y } / as default):
  assert(!flagged.has('AliasedDefineElement'));
  assert(!issues.exports['default-alias-element.ts']?.default);

  // A type referenced only by a registered class's public signature stays alive (DTS chain):
  assert(!flagged.has('DtsChainElement'));
  assert(!issues.types['dts-chain-element.ts']?.ElementConfig);

  // A genuinely unused sibling export is still flagged (only the class is credited):
  assert.equal(issues.exports['native-element.ts'].unusedHelper.symbol, 'unusedHelper');

  // Negative: a tag without a hyphen is not a valid custom element name, so it is not credited:
  assert.equal(issues.exports['no-hyphen.ts'].PlainThing.symbol, 'PlainThing');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 11,
    total: 11,
  });
});
