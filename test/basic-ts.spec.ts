import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src';

test('Find unused files and exports', async () => {
  const workingDir = 'test/fixtures/basic';

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

  assert.equal(issues.files.size, 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.ts'));

  assert.equal(Object.values(issues.exports).length, 2);
  assert.equal(issues.exports['default.ts']['notDefault'].symbol, 'notDefault');
  assert.equal(issues.exports['dep.ts']['unused'].symbol, 'unused');

  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(issues.types['dep.ts']['Dep'].symbolType, 'type');

  assert.equal(Object.values(issues.nsExports).length, 1);
  assert.equal(issues.nsExports['ns.ts']['z'].symbol, 'z');

  assert.equal(Object.values(issues.nsTypes).length, 1);
  assert.equal(issues.nsTypes['ns.ts']['NS'].symbol, 'NS');

  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['dep.ts']['dep|default'].symbols?.[0], 'dep');

  assert.deepEqual(counters, {
    dependencies: 0,
    devDependencies: 0,
    duplicates: 1,
    exports: 2,
    files: 1,
    nsExports: 1,
    nsTypes: 1,
    processed: 5,
    types: 1,
    unresolved: 0,
  });
});
