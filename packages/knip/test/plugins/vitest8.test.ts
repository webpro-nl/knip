import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/vitest8');

test('Find dependencies with the Vitest plugin (8)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['vitest.config.ts']['./vitest.integration.setup.mjs']);
  assert(issues.unresolved['vitest.config.ts']['./vitest.unit.setup.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 0,
    unresolved: 2,
    processed: 3,
    total: 3,
  });
});
