import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces-self-and-cross-ref');
const leafCwd = resolve('fixtures/workspaces-self-and-cross-ref/packages/app');

test('Resolve aliased workspace dependencies (dep key differs from package name)', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 0,
    processed: 5,
    total: 5,
  });
});

test('Resolve aliased workspace dependencies from leaf workspace', async () => {
  const options = await createOptions({ cwd: leafCwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
