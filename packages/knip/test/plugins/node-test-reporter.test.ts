import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/node-test-reporter');

test('Do not treat a node --test-reporter flag as a test runner invocation', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('orphan.test.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});
