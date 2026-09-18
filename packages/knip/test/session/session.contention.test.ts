import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFileDescriptor } from '../../src/session/file-descriptor.ts';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';
import { describeFile } from './util.ts';

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

  assert.equal(left.file.contention.DIAMOND.sites[0].kind, 'converged');
  assert.deepEqual(left.file.contention.DIAMOND.sites, [
    {
      kind: 'converged',
      filePath: join(cwd, 'diamond-top.ts'),
      identifier: 'DIAMOND',
      origins: [{ filePath: join(cwd, 'diamond-base.ts'), identifier: 'DIAMOND', line: 1, col: 14 }],
      sources: [join(cwd, 'diamond-left.ts'), join(cwd, 'diamond-right.ts')],
    },
  ]);
  assert.deepEqual(base.file.contention.DIAMOND.sites, left.file.contention.DIAMOND.sites);
});

test('identifies shadowed contention with a winner', async () => {
  const { file } = await describeFile(cwd, 'overload-1.ts');

  const overload = file.contention.OVERLOAD;
  assert.ok(overload, 'missing OVERLOAD contention summary');

  const expected = [join(cwd, 'overload-1.ts'), join(cwd, 'overload-2.ts')];

  assert.deepEqual(overload.conflict, expected);
  assert.deepEqual(overload.branching, []);
  assert.equal(overload.sites[0].kind, 'shadowed');
  assert.deepEqual(overload.sites, [
    {
      kind: 'shadowed',
      filePath: join(cwd, 'overload-1.ts'),
      identifier: 'OVERLOAD',
      origins: [{ filePath: join(cwd, 'overload-2.ts'), identifier: 'OVERLOAD', line: 1, col: 14 }],
      sources: [join(cwd, 'overload-2.ts')],
      line: 1,
      col: 14,
      winner: { filePath: join(cwd, 'overload-1.ts'), identifier: 'OVERLOAD', line: 1, col: 14 },
    },
  ]);
});

test('reports the shadowing site from the shadowed definition', async () => {
  const { file } = await describeFile(cwd, 'overload-3.ts');

  const overload = file.contention.OVERLOAD;
  assert.ok(overload, 'missing OVERLOAD contention summary');

  assert.equal(overload.sites[0].kind, 'shadowed');
  assert.deepEqual(overload.conflict, [join(cwd, 'overload-2.ts'), join(cwd, 'overload-3.ts')]);
  assert.deepEqual(overload.sites, [
    {
      kind: 'shadowed',
      filePath: join(cwd, 'overload-2.ts'),
      identifier: 'OVERLOAD',
      origins: [{ filePath: join(cwd, 'overload-3.ts'), identifier: 'OVERLOAD', line: 1, col: 14 }],
      sources: [join(cwd, 'overload-3.ts')],
      line: 1,
      col: 14,
      winner: { filePath: join(cwd, 'overload-2.ts'), identifier: 'OVERLOAD', line: 1, col: 14 },
    },
  ]);
});

test('orders the described file own site before the site it shadows in turn', async () => {
  const { file } = await describeFile(cwd, 'overload-2.ts');

  const overload = file.contention.OVERLOAD;
  assert.ok(overload, 'missing OVERLOAD contention summary');

  assert.equal(overload.sites[0].kind, 'shadowed');
  assert.deepEqual(overload.sites, [
    {
      kind: 'shadowed',
      filePath: join(cwd, 'overload-2.ts'),
      identifier: 'OVERLOAD',
      origins: [{ filePath: join(cwd, 'overload-3.ts'), identifier: 'OVERLOAD', line: 1, col: 14 }],
      sources: [join(cwd, 'overload-3.ts')],
      line: 1,
      col: 14,
      winner: { filePath: join(cwd, 'overload-2.ts'), identifier: 'OVERLOAD', line: 1, col: 14 },
    },
    {
      kind: 'shadowed',
      filePath: join(cwd, 'overload-1.ts'),
      identifier: 'OVERLOAD',
      origins: [{ filePath: join(cwd, 'overload-2.ts'), identifier: 'OVERLOAD', line: 1, col: 14 }],
      sources: [join(cwd, 'overload-2.ts')],
      line: 1,
      col: 14,
      winner: { filePath: join(cwd, 'overload-1.ts'), identifier: 'OVERLOAD', line: 1, col: 14 },
    },
  ]);
});

test('reports the fan-in from the barrel that combines the paths, not from its consumer', async () => {
  const barrel = await describeFile(cwd, 'src/types/public/index.ts');
  const consumer = await describeFile(cwd, 'src/index.ts');

  assert.equal(barrel.file.contention.SSRManifest?.sites[0].kind, 'converged');
  assert.deepEqual(barrel.file.contention.SSRManifest?.sites[0].sources, [
    join(cwd, 'src/core/app/types.ts'),
    join(cwd, 'src/types/public/internal.ts'),
  ]);
  assert.equal(consumer.file.contention.SSRManifest, undefined);
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

  const { session: sessionHandler } = await (await import('../../src/run.ts')).run(options);
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
