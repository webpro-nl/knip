import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mise');

test('Find package binaries and entry files in mise TOML tasks', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies['package.json'] ?? {}), ['unused-package']);
  assert.deepEqual(Object.keys(issues.files).sort(), ['.config/scripts/grouped.ts', 'scripts/unused.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    devDependencies: 1,
    processed: 5,
    total: 5,
  });
});
