import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/loaders');

test('Inline dynamic import loaders consume only the default export of modules that have one', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['pages/dashboard.ts'].unusedWidget);
  assert(issues.exports['pages/profile.ts'].unusedAvatar);
  assert(issues.exports['pages/settings.ts'].unusedToggle);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 7,
    total: 7,
  });
});
