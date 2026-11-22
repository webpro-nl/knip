import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsc-files-mode-references');

test('Should use files of referenced tsconfigs as project files (solution-style tsconfig)', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.files).length, 0);
  assert(issues.exports['src/module.ts']['unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 4,
    total: 4,
  });
});

test('Should report unimported files as unused (solution-style tsconfig)', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: false });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.files).length, 3);
  assert('src/excluded.ts' in issues.files);
  assert('src/declare-module.ts' in issues.files);
  assert('src/declare-global.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 3,
    processed: 5,
    total: 5,
  });
});
