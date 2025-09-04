import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/include-entry-exports');

test('Skip unused exports in entry source files', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Report unused exports in entry source files', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['cli.js']['a']);
  assert(issues.exports['index.ts']['default']);
  assert(issues.exports['main.ts']['x']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    types: 3,
    processed: 4,
    total: 4,
  });
});
