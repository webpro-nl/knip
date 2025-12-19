import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFileDescriptor } from '../../src/session/file-descriptor.js';
import { createSession } from '../../src/session/session.js';
import { join } from '../../src/util/path.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';
import { describeFile } from './util.js';

const cwd = resolve('fixtures/session');

test('reports branching contention for all files in chain', async () => {
  const left = await describeFile(cwd, 'diamond-left.ts');
  const right = await describeFile(cwd, 'diamond-right.ts');
  const base = await describeFile(cwd, 'diamond-base.ts');

  assert.ok(left.file.contention.DIAMOND);
  assert.ok(right.file.contention.DIAMOND);
  assert.ok(base.file.contention.DIAMOND);

  assert.ok(
    left.file.contention.DIAMOND.branching.includes(join(left.cwd, 'diamond-top.ts')),
    'diamond-left.ts should include diamond-top.ts in branching'
  );
});

test('identifies conflict contention', async () => {
  const { file } = await describeFile(cwd, 'overload-1.ts');

  const overload = file.contention.OVERLOAD;
  assert.ok(overload, 'missing OVERLOAD contention summary');

  const expected = [join(cwd, 'overload-1.ts'), join(cwd, 'overload-2.ts'), join(cwd, 'overload-3.ts')];

  assert.deepEqual(overload.conflict, expected);
  assert.deepEqual(overload.branching, []);
});

test('propagates star re-exports for diamond-top.ts', async () => {
  const { file } = await describeFile(cwd, 'diamond-top.ts');

  const exportedIds = file.exports.map(entry => entry.identifier).sort();
  assert.ok(exportedIds.includes('DIAMOND'));

  const diamondExport = file.exports.find(entry => entry.identifier === 'DIAMOND');
  assert.ok(diamondExport);
  assert.equal(diamondExport.importLocations.length > 0, true);
});

test('allows same identifier under different namespaces without contention', async () => {
  const host = await describeFile(cwd, 'host.ts');
  const worker = await describeFile(cwd, 'worker.ts');

  assert.equal(host.file.contention.start, undefined);
  assert.equal(worker.file.contention.start, undefined);
});

test('detects circular dependency c → a → b → c', async () => {
  const { file } = await describeFile(cwd, 'c.ts');

  assert.ok(file.cycles.length > 0);

  const canonicalCycle = [join(cwd, 'c.ts'), join(cwd, 'a.ts'), join(cwd, 'b.ts'), join(cwd, 'c.ts')];

  const hasCycle = file.cycles.some(
    cycle => cycle.length === canonicalCycle.length && cycle.every((value, idx) => value === canonicalCycle[idx])
  );
  assert.ok(hasCycle);
});

test('false disables contention reporting', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  const withContention = session.describeFile(join(options.cwd, 'diamond-top.ts'));
  assert.ok(withContention);
  assert.ok(withContention.contention.DIAMOND);

  const { session: sessionHandler } = await (await import('../../src/run.js')).run(options);
  assert.ok(sessionHandler);

  const graph = sessionHandler.getGraph();
  const entryPaths = sessionHandler.getEntryPaths();
  const filePath = join(options.cwd, 'diamond-top.ts');

  const withoutContention = buildFileDescriptor(filePath, options.cwd, graph, entryPaths, {
    isShowContention: false,
  });
  assert.ok(withoutContention);
  assert.deepEqual(withoutContention.contention, Object.create(null));
});
