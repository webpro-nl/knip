import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

test('Find unused exports respecting ignoreExportsUsedInFile: true', async () => {
  const cwd = resolve('fixtures/ignore-exports-used-in-file');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(issues.exports['imported.ts']['referencedNeverFunction'].symbol, 'referencedNeverFunction');
  assert.equal(issues.exports['imported.ts']['default'].symbol, 'default');
  assert.equal(issues.exports['imported.ts']['DeclaredThenExportedNamed'].symbol, 'DeclaredThenExportedNamed');

  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(Object.values(issues.types['imported.ts']).length, 1);
  assert.equal(issues.types['imported.ts']['ReferencedNeverInterface'].symbol, 'ReferencedNeverInterface');

  assert.deepEqual(counters, {
    ...baseCounters,
    duplicates: 0,
    exports: 3,
    nsExports: 0,
    nsTypes: 0,
    processed: 2,
    total: 2,
    types: 1,
  });
});

test('Find unused exports respecting ignoreExportsUsedInFile: false', async () => {
  const cwd = resolve('fixtures/ignore-exports-used-in-file-false');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(issues.exports['imported.ts']['default'].symbol, 'default');
  assert.equal(issues.exports['imported.ts']['DeclaredThenExportedNamed'].symbol, 'DeclaredThenExportedNamed');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
