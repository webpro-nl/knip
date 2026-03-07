import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { join } from '../src/util/path.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/compilers-scss');

test('Built-in compiler for SCSS', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'unused.scss')));

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 1,
    processed: 14,
    total: 14,
  });
});
