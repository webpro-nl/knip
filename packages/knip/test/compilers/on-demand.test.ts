import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/on-demand');

test('Compile reachable sources once, including async sources outside the project glob', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['unused.native']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 6,
    total: 6,
  });
});
