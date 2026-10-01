import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore-exports-used-in-file/re-export-local-unused');

test('Find unused exports respecting an ignoreExportsUsedInFile (re-export of unreferenced import)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('grape' in issues.exports['barrel.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 3,
    total: 3,
  });
});
