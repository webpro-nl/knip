import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces-plugin-config');

test('Use root plugin config in workspaces', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    total: 26,
    processed: 26,
  });
});

test('Use root plugin config in workspaces (strict production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert.deepEqual(
    issues.files,
    new Set([
      join(cwd, 'packages/frontend/components/component.js'),
      join(cwd, 'packages/package1/components/component.js'),
      join(cwd, 'packages/package1/jest-setup.ts'),
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    total: 7,
    processed: 7,
  });
});
