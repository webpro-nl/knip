import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest-preset-root-dir');

test('Resolve relative Jest preset from rootDir', async () => {
  const options = await createOptions({ cwd });
  const { counters, hasConfigLoadErrors } = await main(options);

  assert(!hasConfigLoadErrors);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
