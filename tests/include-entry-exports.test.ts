import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve, join } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('tests/fixtures/include-entry-exports');

test('Report unused files and exports in entry files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert(issues.files.has(join(cwd, 'unused.ts')));

  assert(issues.exports['cli.js']['a']);
  assert(issues.exports['index.ts']['default']);
  assert(issues.exports['main.ts']['x']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 3,
    types: 3,
    processed: 5,
    total: 5,
  });
});

test('Skip unused files and exports in entry files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: false,
  });

  assert(issues.files.has(join(cwd, 'unused.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 5,
    total: 5,
  });
});
