import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore-exports-used-in-file/re-export-name-collision');

test('Find unused exports respecting an ignoreExportsUsedInFile (re-export sharing an import name)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('helper' in issues.exports['barrel.ts']);
  assert('compute' in issues.exports['math.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 4,
    total: 4,
  });
});
