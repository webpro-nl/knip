import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies with the Web Test Runner plugin', async () => {
  const cwd = resolve('fixtures/plugins/web-test-runner');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'checks.js',
    'spec/decorated/only.js',
    'spec/skipped.js',
    'unused.js',
  ]);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 13,
    total: 13,
  });
});
