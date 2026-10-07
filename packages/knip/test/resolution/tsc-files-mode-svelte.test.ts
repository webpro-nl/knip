import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsc-files-mode-svelte');

test('Auto-detect compiler-extension files within tsconfig include scope (--use-tsconfig-files)', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/helper.ts']?.orphan);
  assert(!issues.exports['src/helper.ts']?.used);
  assert('src/Orphan.svelte' in issues.files);
  assert(!('examples/Stray.svelte' in issues.files));
  assert(!('src/legacy/Old.svelte' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    exports: 1,
    files: 1,
    processed: 4,
    total: 4,
  });
});

test('Resolve tsconfig include and exclude from the tsconfig dir (--tsConfig)', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true, args: { tsConfig: 'config/tsconfig.json' } });
  const { issues, counters } = await main(options);

  assert('src/Orphan.svelte' in issues.files);
  assert(!('examples/Stray.svelte' in issues.files));
  assert(!('src/legacy/Old.svelte' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    exports: 1,
    files: 1,
    processed: 4,
    total: 4,
  });
});

test('Glob compiler-extension files from the workspace dir when tsconfig has no include', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true, args: { tsConfig: 'tsconfig.files.json' } });
  const { issues, counters } = await main(options);

  assert('src/Orphan.svelte' in issues.files);
  assert('examples/Stray.svelte' in issues.files);
  assert('src/legacy/Old.svelte' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    files: 3,
    processed: 5,
    total: 5,
  });
});
