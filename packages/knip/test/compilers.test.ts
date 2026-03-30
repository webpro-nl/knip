import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/compilers');

test('Support compiler functions in config', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('unused.css' in issues.files);
  assert('unused.md' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 11,
    total: 11,
  });
});
