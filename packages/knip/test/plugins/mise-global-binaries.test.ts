import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mise-global-binaries');

test('Keep mise-managed and ambiguous global binaries separate from package dependencies', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies['package.json'] ?? {}), [
    'eslint',
    'asset-builder',
    'node',
    'find',
  ]);
  assert.deepEqual(Object.keys(issues.binaries['mise.toml']), ['missing-local-cli', 'missing-concurrent-cli']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 4,
    binaries: 2,
    processed: 0,
    total: 0,
  });
});
