import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-binary-resolution');

test('Find unused dependencies and binaries in workspaces with cross-workspace binary resolution (default)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(!issues.devDependencies['packages/tools/package.json']?.['typescript']);
  assert(!issues.binaries['packages/lib/package.json']?.['tsc']);
  assert(issues.devDependencies['packages/lib/package.json']['unused-tool']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 2,
    total: 2,
  });
});

test('Find unused dependencies and binaries in workspaces with cross-workspace binary resolution (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.equal(Object.keys(issues.devDependencies).length, 0);
  assert.equal(Object.keys(issues.binaries).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Find unused dependencies and binaries in workspaces with cross-workspace binary resolution (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
  });

  assert(issues.binaries['packages/lib/package.json']?.['tsc']);
  assert(!issues.devDependencies['packages/tools/package.json']?.['typescript']);
  assert(issues.devDependencies['packages/lib/package.json']['unused-tool']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    binaries: 1,
    processed: 2,
    total: 2,
  });
});