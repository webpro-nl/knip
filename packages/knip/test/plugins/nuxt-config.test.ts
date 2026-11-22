import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nuxt-config');
const stringCwd = resolve('fixtures/plugins/nuxt-config-string');

test('Find dependencies and literal module type imports with the nuxt plugin (config options)', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['lib/h/types.ts']);

  // a declared css package that is not installed (@fontsource/roboto) is still credited by name

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 12,
    total: 12,
  });
});

test('Find dependencies with the nuxt plugin (string extends)', async () => {
  const options = await createOptions({ cwd: stringCwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 2,
    total: 2,
  });
});
