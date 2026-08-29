import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/promise-sync');

test('Compiler returning a Promise without async is treated as async (resolve #1906)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.dependencies['package.json']?.['dep'], undefined);
  assert.deepEqual(issues.files, {});

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
