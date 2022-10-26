import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';
import baseCounters from './fixtures/baseCounters.js';

test('Find unused files and exports with JS entry file', async () => {
  const workingDir = 'test/fixtures/entry-js';

  const { issues, counters } = await main({
    ...baseArguments,
    cwd: workingDir,
    workingDir,
  });

  assert.equal(issues.files.size, 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.js'));

  assert.equal(Object.values(issues.exports).length, 1);
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
    ...baseCounters,
    files: 1,
    unlisted: 0,
    exports: 1,
    nsExports: 1,
    nsTypes: 1,
    types: 1,
    duplicates: 1,
    processed: 4,
    total: 4,
  });
});
