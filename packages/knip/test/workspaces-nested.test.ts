import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-nested');

const expectedConfigurationHints = new Set([
  { type: 'ignoreWorkspaces', identifier: 'unused-ignored-workspace' },
  { type: 'ignoreBinaries', identifier: 'unused-ignored-bin-global', workspaceName: '.' },
  { type: 'ignoreBinaries', identifier: 'unused-ignored-bin-L-2', workspaceName: 'L-1-1/L-1-2' },
  { type: 'ignoreDependencies', identifier: 'ignored-dep-global', workspaceName: '.' },
  { type: 'ignoreDependencies', identifier: 'unused-ignored-dep-global', workspaceName: '.' },
  { type: 'ignoreDependencies', identifier: 'unused-ignored-dep-L-3', workspaceName: 'L-1-1/L-1-2/L-1-3' },
]);

test('Find unused dependencies in nested workspaces with default config in production mode (default)', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isStrict: false,
    isProduction: false,
  });

  assert(issues.dependencies['L-1-1/L-1-2/L-1-3/package.json']['package-1-3-dev']);
  assert(issues.devDependencies['L-1-1/package.json']['package-1-1-dev']);
  assert(issues.devDependencies['L-1-1/L-1-2/package.json']['package-1-2-dev']);
  assert(issues.unlisted['L-1-1/L-1-2/index.ts']['ignored-dep-L-3']);
  assert(issues.binaries['L-1-1/L-1-2/L-1-3/package.json']['ignored-bin-L-2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    devDependencies: 2,
    unlisted: 1,
    binaries: 1,
    processed: 3,
    total: 3,
  });

  assert.deepEqual(configurationHints, expectedConfigurationHints);
});

test('Find unused dependencies in nested workspaces with default config in production mode (production)', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isStrict: false,
    isProduction: true,
  });

  assert(issues.dependencies['L-1-1/L-1-2/L-1-3/package.json']['package-1-3-dev']);
  assert(issues.unlisted['L-1-1/L-1-2/index.ts']['ignored-dep-L-3']);
  assert(issues.binaries['L-1-1/L-1-2/L-1-3/package.json']['ignored-bin-L-2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 1,
    binaries: 1,
    processed: 3,
    total: 3,
  });

  assert.deepEqual(configurationHints, new Set());
});

test('Find unused dependencies in nested workspaces with default config in production mode (strict)', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
    isProduction: true,
  });

  assert(issues.dependencies['L-1-1/L-1-2/L-1-3/package.json']['package-1-3-dev']);
  assert(issues.unlisted['L-1-1/L-1-2/L-1-3/index.ts']['package-1-2']);
  assert(issues.unlisted['L-1-1/L-1-2/index.ts']['ignored-dep-L-3']);
  assert(issues.binaries['L-1-1/L-1-2/L-1-3/package.json']['ignored-bin-L-2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 2,
    binaries: 1,
    processed: 3,
    total: 3,
  });

  assert.deepEqual(configurationHints, new Set());
});
