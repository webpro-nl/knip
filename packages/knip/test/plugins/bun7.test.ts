import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/bun7');

test('Enable the Bun plugin on a lockfile without treating test files as entries', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('index.test.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});
