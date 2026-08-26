import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/less');

test('Built-in compiler for Less', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('unused.less' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 8,
    total: 8,
  });
});
