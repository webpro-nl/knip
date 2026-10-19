import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest-projects');

test('Load Jest projects as Jest configs', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, hasConfigLoadErrors } = await main(options);

  assert(!hasConfigLoadErrors);
  assert(issues.files['packages/app/index.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 8,
    total: 8,
  });
});
