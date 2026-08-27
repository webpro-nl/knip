import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/node-fs-promises-glob');

test('Resolve statically analyzable node:fs/promises glob patterns as entry files', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 6,
    total: 6,
  });
  assert('dynamic/one.ts' in issues.files);
  assert(!('migrations/one.ts' in issues.files));
  assert(!('root/one.ts' in issues.files));
  assert(!('nested/one.ts' in issues.files));
});
