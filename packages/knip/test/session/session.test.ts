import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from '../../src/util/path.js';
import { resolve } from '../helpers/resolve.js';
import { describeFile } from './util.js';

const cwd = resolve('fixtures/session');

test('describes exports for a.ts', async () => {
  const { file } = await describeFile(cwd, 'a.ts');

  assert.deepEqual(
    file.exports.map(_export => _export.identifier),
    ['A']
  );
  assert.equal(file.internalImports.length, 1);
  assert.equal(file.internalImports[0].filePath, join(cwd, 'b.ts'));
  const expectedCycle = [join(cwd, 'a.ts'), join(cwd, 'b.ts'), join(cwd, 'c.ts'), join(cwd, 'a.ts')];
  const hasCycle = file.cycles.some(
    cycle => cycle.length === expectedCycle.length && cycle.every((value, idx) => value === expectedCycle[idx])
  );
  assert.ok(hasCycle);

  const exportA = file.exports[0];
  assert.equal(exportA.importLocations.length, 0);
  assert.ok(exportA.entryPaths.has(join(cwd, 'index.ts')));
});

test('tracks internal imports for index.ts', async () => {
  const { file } = await describeFile(cwd, 'index.ts');

  const overloadImport = file.internalImports.find(entry => entry.identifier === 'OVERLOAD');
  assert.ok(overloadImport, 'missing OVERLOAD import');
  assert.equal(overloadImport.filePath, join(cwd, 'overload-1.ts'));
  assert.equal(file.cycles.length, 0);
});

test('tracks usage of default exports', async () => {
  const { file } = await describeFile(cwd, 'default-export.ts');

  const defaultExport = file.exports.find(entry => entry.identifier === 'default');
  assert.ok(defaultExport, 'missing default export entry');
  assert.ok(defaultExport.importLocations.length > 0);
  assert.ok(defaultExport.importLocations.some(location => location.filePath === join(cwd, 'index.ts')));
});

test('ignores namespace importers that never reference a member', async () => {
  const { file } = await describeFile(cwd, 'rose.ts');

  const roseExport = file.exports.find(entry => entry.identifier === 'rose');
  assert.ok(roseExport, 'missing rose export entry');
  const namespaceImportPath = join(cwd, 'flowers.ts');
  assert.ok(roseExport.importLocations.every(location => location.filePath !== namespaceImportPath));
});

test('summarizes diamond-shaped branching contention', async () => {
  const { file } = await describeFile(cwd, 'diamond-top.ts');

  const diamond = file.contention.DIAMOND;
  assert.ok(diamond, 'missing DIAMOND contention summary');

  const expected = [join(cwd, 'diamond-top.ts')];

  assert.deepEqual(new Set(diamond.branching), new Set(expected));
  assert.deepEqual(diamond.conflict, []);
});
