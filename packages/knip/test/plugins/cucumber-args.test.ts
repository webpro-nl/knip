import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find Cucumber modules, support directories and configs from options', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/cucumber-args') });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['hooks/unused.ts', 'support/unused.ts']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 10,
    total: 10,
  });
});
