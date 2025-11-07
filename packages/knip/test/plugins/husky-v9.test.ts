import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/husky-v9');

test('Find dependencies with the husky plugin (v9)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['.husky/pre-push']['jest']);
  assert(issues.binaries['.husky/pre-push']['pretty-quick']);
  assert(issues.binaries['.husky/pre-rebase']['eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 3,
    processed: 0,
    total: 0,
  });
});

test('Find dependencies with the husky plugin (v9) (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});
