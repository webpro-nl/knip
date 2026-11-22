import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/binary-scoped-name');

test('Match scoped bin names to their unscoped executables', async () => {
  const { counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(counters, { ...baseCounters, processed: 0, total: 0 });
});
