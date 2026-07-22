import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore-exports-used-in-file/re-export-specifier');

test('Find unused exports respecting an ignoreExportsUsedInFile (re-export specifier)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.types['schemas.ts']['Dead'].symbol, 'Dead');
  assert.equal(issues.types['barrel.ts']['Dead'].symbol, 'Dead');

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
    types: 2,
  });
});
