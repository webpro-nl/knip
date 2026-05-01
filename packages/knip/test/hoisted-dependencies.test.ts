import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

test('Resolve hoisted binaries from a workspace package run as single project', async () => {
  const cwd = resolve('fixtures/hoisted-dependencies/packages/foo');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 0,
    binaries: 0,
    processed: 0,
    total: 0,
  });
});

test('Resolve hoisted peer dependencies from a workspace package run as single project', async () => {
  const cwd = resolve('fixtures/hoisted-dependencies/packages/bar');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
