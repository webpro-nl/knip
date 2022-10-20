import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src';

test('Resolve modules properly using tsconfig paths and globs', async () => {
  const workingDir = 'test/fixtures/tsconfig-paths';

  const { issues, counters } = await main({
    cwd: workingDir,
    workingDir,
    include: [],
    exclude: [],
    ignore: [],
    gitignore: false,
    isIncludeEntryFiles: false,
    isDev: false,
    isShowProgress: false,
    jsDoc: [],
    debug: {
      isEnabled: false,
      level: 0,
    },
  });

  assert.deepEqual(Array.from(issues.dependencies), ['internal']);

  assert.equal(issues.unlisted['index.ts']['@unknown'].symbol, '@unknown');
  assert.equal(issues.unlisted['index.ts']['unresolved/dir'].symbol, 'unresolved/dir');

  assert.equal(issues.exports['internal-package/index.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['unprefixed/module.ts']['unused'].symbol, 'unused');

  assert.deepEqual(counters, {
    files: 0,
    dependencies: 1,
    devDependencies: 0,
    unlisted: 2,
    exports: 2,
    types: 0,
    nsExports: 0,
    nsTypes: 0,
    duplicates: 0,
    processed: 4,
    total: 4,
  });
});
