import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { join } from '../src/util/path.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/compilers');

test('Support compiler functions in config', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'unused.css')));
  assert(issues.files.has(join(cwd, 'unused.md')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 11,
    total: 11,
  });
});
