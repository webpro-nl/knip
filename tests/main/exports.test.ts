import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { joinPosix } from '../helpers/index.js';

const cwd = path.resolve('tests/fixtures/exports');

test('Find unused files and exports', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);
  assert(issues.files.has(joinPosix(cwd, 'dangling.ts')));

  assert.equal(Object.values(issues.exports).length, 4);
  assert.equal(issues.exports['default.ts']['SomeExport'].symbol, 'SomeExport');
  assert.equal(issues.exports['my-module.ts']['default'].symbol, 'default');
  assert.equal(issues.exports['my-module.ts']['unusedExportA'].symbol, 'unusedExportA');
  assert.equal(issues.exports['my-module.ts']['unusedExportB'].symbol, 'unusedExportB');
  assert.equal(issues.exports['named.ts']['renamed'].symbol, 'renamed');
  assert.equal(issues.exports['named.ts']['name3'].symbol, 'name3');
  assert.equal(issues.exports['dynamic-import.ts']['unusedExportedValue'].symbol, 'unusedExportedValue');
  assert(!issues.exports['index.ts']);

  assert.equal(Object.values(issues.types).length, 2);
  assert.equal(issues.types['my-module.ts']['MyType'].symbolType, 'type');
  assert.equal(issues.types['types.ts']['Num'].symbolType, 'type');
  assert.equal(issues.types['types.ts']['Key1'].symbolType, 'type');
  assert.equal(issues.types['types.ts']['Key2'].symbolType, 'type');
  assert(!issues.types['index.ts']);

  assert.equal(Object.values(issues.nsExports).length, 1);
  assert.equal(issues.nsExports['my-namespace.ts']['key'].symbol, 'key');

  assert.equal(Object.values(issues.nsTypes).length, 1);
  assert.equal(issues.nsTypes['my-namespace.ts']['MyNamespace'].symbol, 'MyNamespace');

  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['my-module.ts']['exportedValue|default'].symbols?.[0], 'exportedValue');

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    unlisted: 0,
    exports: 7,
    nsExports: 1,
    types: 4,
    nsTypes: 1,
    duplicates: 1,
    processed: 15,
    total: 15,
  });
});
