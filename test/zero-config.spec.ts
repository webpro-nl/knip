import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';
import baseCounters from './fixtures/baseCounters.js';

test('Find unused exports in zero-config mode', async () => {
  const workingDir = path.resolve('test/fixtures/zero-config');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd: workingDir,
    workingDir,
    isIncludeEntryFiles: true,
  });

  assert.equal(issues.files.size, 0);

  assert.equal(Object.values(issues.exports).length, 2);
  assert.equal(issues.exports['dep.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['index.ts']['b'].symbol, 'b');

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
    exports: 2,
    nsExports: 1,
    types: 1,
    nsTypes: 1,
    duplicates: 1,
    processed: 3,
    total: 3,
  });
});
