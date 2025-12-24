import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/tsc-files-mode');

test('Should use tsconfig files/include/exclude as project boundaries', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true });
  const { issues, counters } = await main(options);

  assert.equal(issues.files.size, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 4,
    total: 4,
  });
});

test('Should report unimported files as unused', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: false });
  const { issues, counters } = await main(options);

  assert.equal(issues.files.size, 3);
  assert(issues.files.has(join(cwd, 'src/excluded.ts')));
  assert(issues.files.has(join(cwd, 'src/declare-module.ts')));
  assert(issues.files.has(join(cwd, 'src/declare-global.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 3,
    processed: 5,
    total: 5,
  });
});
