import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/tsc-files-mode-svelte');

test('Auto-detect compiler-extension files within tsconfig include scope (--use-tsconfig-files)', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/helper.ts']?.orphan);
  assert(!issues.exports['src/helper.ts']?.used);
  assert('src/Orphan.svelte' in issues.files);
  assert(!('examples/Stray.svelte' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    exports: 1,
    files: 1,
    processed: 4,
    total: 4,
  });
});
