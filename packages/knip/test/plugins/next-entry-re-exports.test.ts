import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Keeps Next.js default re-exports live with entry-export checks', async () => {
  const cwd = resolve('fixtures/plugins/next-entry-re-exports');
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.exports['components.tsx']), ['UnusedComponent']);
  assert.deepEqual(Object.keys(issues.types['components.tsx']), ['UnusedProps']);
  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    types: 1,
    processed: 5,
    total: 5,
  });
});
