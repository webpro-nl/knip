import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

test('Find unused files and exports with JS entry file', async () => {
  const cwd = 'test/fixtures/entry-js';

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.js'));

  assert.equal(Object.values(issues.exports).length, 2);
  assert.equal(issues.exports['my-module.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['index.js']['b'].symbol, 'b');

  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(issues.types['my-module.ts']['Dep'].symbolType, 'type');

  assert.equal(Object.values(issues.nsExports).length, 1);
  assert.equal(issues.nsExports['my-namespace.ts']['z'].symbol, 'z');

  assert.equal(Object.values(issues.nsTypes).length, 1);
  assert.equal(issues.nsTypes['my-namespace.ts']['NS'].symbol, 'NS');

  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['my-module.ts']['dep|default'].symbols?.[0], 'dep');

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    unlisted: 0,
    exports: 2,
    nsExports: 1,
    nsTypes: 1,
    types: 1,
    duplicates: 1,
    processed: 4,
    total: 4,
  });
});
