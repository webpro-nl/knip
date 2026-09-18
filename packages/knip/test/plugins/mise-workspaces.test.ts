import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mise-workspaces');

test('Resolve mise task directories and workspace-local configuration', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies), ['package.json']);
  assert.deepEqual(Object.keys(issues.devDependencies['package.json']), ['asset-builder']);
  assert.deepEqual(Object.keys(issues.files), ['scripts/direct-entry.ts', 'scripts/package-entry.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    devDependencies: 1,
    processed: 6,
    total: 6,
  });
});
