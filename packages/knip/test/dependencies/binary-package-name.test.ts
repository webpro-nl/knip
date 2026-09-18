import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/binary-package-name');

test('Do not resolve package names as binaries they do not provide', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}), ['custom-builder']);
  assert.deepEqual(Object.keys(issues.devDependencies['package.json'] ?? {}), ['custom-builder']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});
