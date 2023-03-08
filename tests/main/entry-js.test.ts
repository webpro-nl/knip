import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { joinPosix } from '../helpers/index.js';

test('Find unused files and exports with JS entry file', async () => {
  const cwd = path.resolve('tests/fixtures/entry-js');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);
  assert(issues.files.has(joinPosix(cwd, 'dangling.js')));

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(issues.exports['my-module.js']['unused'].symbol, 'unused');
  assert.equal(issues.exports['my-module.js']['default'].symbol, 'default');

  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(issues.types['my-module.js']['AnyType'].symbolType, 'type');

  assert.equal(Object.values(issues.nsExports).length, 1);
  assert.equal(issues.nsExports['my-namespace.ts']['key'].symbol, 'key');

  assert.equal(Object.values(issues.nsTypes).length, 1);
  assert.equal(issues.nsTypes['my-namespace.ts']['MyNamespace'].symbol, 'MyNamespace');

  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['my-module.js']['myExport|default'].symbols?.[0], 'myExport');

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
