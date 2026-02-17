import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/metro-defaults');

test('Ignore unresolved issues for Metro defaults', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['metro']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unresolved: 0,
    processed: 2,
    total: 2,
  });
});
