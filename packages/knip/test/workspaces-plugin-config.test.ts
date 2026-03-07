import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { join } from '../src/util/path.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

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
