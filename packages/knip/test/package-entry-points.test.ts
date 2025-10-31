import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/package-entry-points');

test('Resolve package entry points to source files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(issues.exports['feature/internal/system/used.ts'].unused);
  assert(issues.files.has(join(cwd, 'feature/internal/system/unused.ts')));
  assert(issues.files.has(join(cwd, 'src/public/lib/rary/lost.js')));

  const filePath = join(cwd, 'package.json');
  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'package-entry', identifier: './feature/index.js', workspaceName: '.', filePath },
      { type: 'package-entry', identifier: './not-found.tsx', workspaceName: '.', filePath },
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 2,
    processed: 12,
    total: 12,
  });
});

test('Resolve package entry points to source files and report unused exports', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

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
