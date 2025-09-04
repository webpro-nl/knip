import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/re-exports-export-ns');

test('Find re-exports through namespaces (2)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['4-leaf-C.ts']['NS.fnC']);
  assert(issues.enumMembers['4-leaf-A.ts']['EnumA.UnusedProp']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 1,
    exports: 1,
    processed: 7,
    total: 7,
  });
});

test('Find re-exports through namespaces (2) including entry files', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['index.ts']['default']);
  assert(issues.exports['4-leaf-C.ts']['NS.fnC']);
  // assert(issues.nsExports['1-root.ts']['exportedFnOnNs']); // only when `nsExports` is included
  assert(issues.enumMembers['4-leaf-A.ts']['EnumA.UnusedProp']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    enumMembers: 1,
    processed: 7,
    total: 7,
  });
});
