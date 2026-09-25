import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/npm-exec');

test('npm exec references installed providers and permits temporary packages', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies['package.json']), ['unused-provider']);
  assert.deepEqual(Object.keys(issues.binaries['package.json']), ['missing-build-cli']);
  assert.deepEqual(counters, { ...baseCounters, devDependencies: 1, binaries: 1 });
});
