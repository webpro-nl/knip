import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('tests/fixtures/exports-plugin-entry-exports');

test('Report unused files and exports in plugin entry files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert(issues.exports['src/module1/index.ts']['sum']);
  assert(issues.exports['src/module1/index.ts']['multiply']);
  assert(issues.exports['src/module2/index.ts']['test']);
  assert(issues.exports['src/module3/index.ts']['calculate']);
  assert(issues.exports['src/module3/index.ts']['smth']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 5,
    processed: 3,
    total: 3,
  });
});

test('Skip unused files and exports in plugin entry files', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: false,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
