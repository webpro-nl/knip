import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/re-exports-export-ns');

test('Find re-exports through namespaces (1)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.nsExports['4-leaf-C.ts']['fnC']);
  assert(issues.enumMembers['4-leaf-A.ts']['UnusedProp']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 1,
    nsExports: 1,
    processed: 7,
    total: 7,
  });
});

test('Find re-exports through namespaces (1) including entry files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert(issues.exports['index.ts']['default']);
  assert(issues.nsExport['1-root.ts']['exportedFnOnNs']);
  assert(issues.nsExports['4-leaf-C.ts']['fnC']);
  assert(issues.enumMembers['4-leaf-A.ts']['UnusedProp']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    enumMembers: 1,
    nsExport: 1,
    nsExports: 1,
    processed: 7,
    total: 7,
  });
});
