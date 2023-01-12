import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../../src/index.js';
import baseArguments from '../../helpers/baseArguments.js';
import baseCounters from '../../helpers/baseCounters.js';

test('Find unused files and exports', async () => {
  const cwd = 'test/fixtures/basic';

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.ts'));

  assert.equal(Object.values(issues.exports).length, 3);
  assert.equal(issues.exports['default.ts']['SomeExport'].symbol, 'SomeExport');
  assert.equal(issues.exports['my-module.ts']['unusedExportA'].symbol, 'unusedExportA');
  assert.equal(issues.exports['my-module.ts']['unusedExportB'].symbol, 'unusedExportB');
  assert.equal(issues.exports['dynamic-import.ts']['unusedExportedValue'].symbol, 'unusedExportedValue');
  assert(!issues.exports['index.ts']);

  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(issues.types['my-module.ts']['MyType'].symbolType, 'type');
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
    exports: 4,
    nsExports: 1,
    types: 1,
    nsTypes: 1,
    duplicates: 1,
    processed: 6,
    total: 6,
  });
});

test('Find unused files and exports (include entry exports)', async () => {
  const cwd = 'test/fixtures/basic';

  const { issues } = await main({
    ...baseArguments,
    isIncludeEntryExports: true,
    cwd,
  });

  assert.equal(Object.values(issues.exports).length, 4);
  assert.equal(issues.exports['index.ts']['entryFileExport'].symbol, 'entryFileExport');

  assert.equal(Object.values(issues.types).length, 2);
  assert.equal(issues.types['index.ts']['EntryFileExportType'].symbol, 'EntryFileExportType');
});
