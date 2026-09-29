import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mise-local-binaries');

test('Credit bare mise commands through an explicit local binary path', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies['package.json'] ?? {}), [
    'assets',
    'overridden-cli',
    'inline-override-cli',
  ]);
  assert.deepEqual(Object.keys(issues.binaries['.mise.toml'] ?? {}), ['missing-local-cli']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 3,
    binaries: 1,
    processed: 1,
    total: 1,
  });
});
