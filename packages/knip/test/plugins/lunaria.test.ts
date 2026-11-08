import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies and literal renderers with the lunaria core scenario', async () => {
  const cwd = resolve('fixtures/plugins/lunaria/core');
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['t/renderer.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Find dependencies with the lunaria starlight integration scenario', async () => {
  const cwd = resolve('fixtures/plugins/lunaria/starlight');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 2,
    total: 2,
  });
});
