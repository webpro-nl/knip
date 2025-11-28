import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFileDescriptor } from '../../src/session/file-descriptor.js';
import { createSession } from '../../src/session/session.js';
import { join } from '../../src/util/path.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/session');

const describeFile = async (relativePath: string) => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const filePath = join(options.cwd, relativePath);
  const descriptor = session.describeFile(filePath);
  assert.ok(descriptor, `missing descriptor for ${relativePath}`);
  return { file: descriptor, cwd: options.cwd };
};

test('describes exports for a.ts', async () => {
  const { file, cwd } = await describeFile('a.ts');

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
  const { file, cwd } = await describeFile('index.ts');

  const overloadImport = file.internalImports.find(entry => entry.identifier === 'OVERLOAD');
  assert.ok(overloadImport, 'missing OVERLOAD import');
  assert.equal(overloadImport.filePath, join(cwd, 'overload-1.ts'));
  assert.equal(file.cycles.length, 0);
});

test('tracks usage of default exports', async () => {
  const { file, cwd } = await describeFile('default-export.ts');

  const defaultExport = file.exports.find(entry => entry.identifier === 'default');
  assert.ok(defaultExport, 'missing default export entry');
  assert.ok(defaultExport.importLocations.length > 0);
  assert.ok(defaultExport.importLocations.some(location => location.filePath === join(cwd, 'index.ts')));
});

test('ignores namespace importers that never reference a member', async () => {
  const { file, cwd } = await describeFile('rose.ts');

  const roseExport = file.exports.find(entry => entry.identifier === 'rose');
  assert.ok(roseExport, 'missing rose export entry');
  const namespaceImportPath = join(cwd, 'flowers.ts');
  assert.ok(roseExport.importLocations.every(location => location.filePath !== namespaceImportPath));
});

test('summarizes diamond-shaped branching contention', async () => {
  const { file, cwd } = await describeFile('diamond-top.ts');

  const diamond = file.contention.DIAMOND;
  assert.ok(diamond, 'missing DIAMOND contention summary');

  const expected = [join(cwd, 'diamond-top.ts')];

  assert.deepEqual(new Set(diamond.branching), new Set(expected));
  assert.deepEqual(diamond.conflict, []);
});

test('reports branching contention for all files in chain', async () => {
  const left = await describeFile('diamond-left.ts');
  const right = await describeFile('diamond-right.ts');
  const base = await describeFile('diamond-base.ts');

  assert.ok(left.file.contention.DIAMOND);
  assert.ok(right.file.contention.DIAMOND);
  assert.ok(base.file.contention.DIAMOND);

  assert.ok(
    left.file.contention.DIAMOND.branching.includes(join(left.cwd, 'diamond-top.ts')),
    'diamond-left.ts should include diamond-top.ts in branching'
  );
});

test('identifies conflict contention', async () => {
  const { file, cwd } = await describeFile('overload-1.ts');

  const overload = file.contention.OVERLOAD;
  assert.ok(overload, 'missing OVERLOAD contention summary');

  const expected = [join(cwd, 'overload-1.ts'), join(cwd, 'overload-2.ts'), join(cwd, 'overload-3.ts')];

  assert.deepEqual(overload.conflict, expected);
  assert.deepEqual(overload.branching, []);
});

test('propagates star re-exports for diamond-top.ts', async () => {
  const { file } = await describeFile('diamond-top.ts');

  const exportedIds = file.exports.map(entry => entry.identifier).sort();
  assert.ok(exportedIds.includes('DIAMOND'));

  const diamondExport = file.exports.find(entry => entry.identifier === 'DIAMOND');
  assert.ok(diamondExport);
  assert.equal(diamondExport.importLocations.length > 0, true);
});

test('allows same identifier under different namespaces without contention', async () => {
  const host = await describeFile('host.ts');
  const worker = await describeFile('worker.ts');

  assert.equal(host.file.contention.start, undefined);
  assert.equal(worker.file.contention.start, undefined);
});

test('detects circular dependency c → a → b → c', async () => {
  const { file, cwd } = await describeFile('c.ts');

  assert.ok(file.cycles.length > 0);

  const canonicalCycle = [join(cwd, 'c.ts'), join(cwd, 'a.ts'), join(cwd, 'b.ts'), join(cwd, 'c.ts')];

  const hasCycle = file.cycles.some(
    cycle => cycle.length === canonicalCycle.length && cycle.every((value, idx) => value === canonicalCycle[idx])
  );
  assert.ok(hasCycle);
});

test('reportContention: false disables contention reporting', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  const withContention = session.describeFile(join(options.cwd, 'diamond-top.ts'));
  assert.ok(withContention);
  assert.ok(withContention.contention.DIAMOND);

  const { watchHandler } = await (await import('../../src/run.js')).run(options);
  assert.ok(watchHandler);

  const graph = watchHandler.getGraph();
  const entryPaths = watchHandler.getEntryPaths();
  const filePath = join(options.cwd, 'diamond-top.ts');

  const withoutContention = buildFileDescriptor(filePath, options.cwd, graph, entryPaths, {
    isShowContention: false,
  });
  assert.ok(withoutContention);
  assert.deepEqual(withoutContention.contention, Object.create(null));
});
