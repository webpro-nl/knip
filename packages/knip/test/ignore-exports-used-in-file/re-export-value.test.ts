import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore-exports-used-in-file/re-export-value');

test('Find unused exports respecting an ignoreExportsUsedInFile (re-export from source)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('plum' in issues.exports['barrel.ts']);
  assert('plum' in issues.exports['fruits.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 3,
    total: 3,
  });
});
