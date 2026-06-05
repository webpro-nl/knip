import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/catalyst');

test('Credit custom elements registered via Catalyst @controller', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const flagged = new Set(Object.values(issues.exports).flatMap(byId => Object.keys(byId)));

  assert(!flagged.has('HelloWorldElement')); // bare `@controller`
  assert(!flagged.has('AliasedElement')); // `import { controller as register }`

  // Negative — a non-Catalyst (local) `controller` decorator must still be reported:
  assert.equal(issues.exports['not-catalyst-element.ts'].NotCatalystElement.symbol, 'NotCatalystElement');

  // A genuinely unused sibling export is still flagged (only the element is credited):
  assert.equal(issues.exports['hello-world-element.ts'].unusedHelper.symbol, 'unusedHelper');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 4,
    total: 4,
  });
});
