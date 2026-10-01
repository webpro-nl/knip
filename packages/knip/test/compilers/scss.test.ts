import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/scss');

test('Built-in compiler for SCSS', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('unused.scss' in issues.files);
  assert('assets/unused.jpg' in issues.files);
  assert(!('assets/used.jpg' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 19,
    total: 19,
  });
});
