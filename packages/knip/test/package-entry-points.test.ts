import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/package-entry-points');

test('Resolve package entry points to source files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['feature/internal/system/used.ts'].unused);
  assert(issues.files.has(join(cwd, 'feature/internal/system/unused.ts')));
  assert(issues.files.has(join(cwd, 'src/public/lib/rary/lost.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 2,
    processed: 12,
    total: 12,
  });
});

test('Resolve package entry points to source files and report unused exports', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert(issues.exports['feature/internal/system/used.ts'].unused);
  assert(issues.exports['feature/my-feature.js'].unused);
  assert(issues.exports['src/public/lib/rary/index.ts'].entryExport);
  assert(issues.exports['lib/index.js'].entryExport);

  assert(issues.files.has(join(cwd, 'feature/internal/system/unused.ts')));
  assert(issues.files.has(join(cwd, 'src/public/lib/rary/lost.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    files: 2,
    processed: 12,
    total: 12,
  });
});
