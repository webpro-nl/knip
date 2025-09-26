import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces-plugin-config');

test('Use root plugin config in workspaces', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    total: 26,
    processed: 26,
  });
});

test('Use root plugin config in workspaces (strict production)', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(
    issues.files,
    new Set([
      join(cwd, 'packages/frontend/components/component.js'),
      join(cwd, 'packages/shared/components/component.js'),
      join(cwd, 'packages/shared/jest-setup.ts'),
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    total: 8,
    processed: 8,
  });
});
