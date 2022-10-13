import test from 'node:test';
import assert from 'node:assert';
import { main } from '../src';

test('Find unused files and exports with JS entry file', async () => {
  const workingDir = 'test/fixtures/entry-js';

  const { issues, counters } = await main({
    cwd: workingDir,
    workingDir,
    include: [],
    exclude: [],
    ignore: [],
    gitignore: false,
    isDev: false,
    isShowProgress: false,
    jsDoc: [],
    debug: {
      isEnabled: false,
      level: 0,
    },
  });

  assert(issues.files.size === 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.js'));

  assert(Object.values(issues.exports).length === 1);
  assert(issues.exports['dep.ts']['unused'].symbol === 'unused');

  assert(Object.values(issues.types).length === 1);
  assert(issues.types['dep.ts']['Dep'].symbolType === 'type');

  assert(Object.values(issues.nsExports).length === 1);
  assert(issues.nsExports['ns.ts']['z'].symbol === 'z');

  assert(Object.values(issues.nsTypes).length === 1);
  assert(issues.nsTypes['ns.ts']['NS'].symbol === 'NS');

  assert(Object.values(issues.duplicates).length === 1);
  assert(issues.duplicates['dep.ts']['dep|default'].symbols?.[0] === 'dep');

  assert.deepEqual(counters, {
    dependencies: 0,
    devDependencies: 0,
    duplicates: 1,
    exports: 1,
    files: 1,
    nsExports: 1,
    nsTypes: 1,
    processed: 4,
    types: 1,
    unresolved: 0,
  });
});
