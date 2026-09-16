import assert from 'node:assert/strict';
import test from 'node:test';
import { IMPORT_FLAGS } from '../../src/constants.ts';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import { run } from '../../src/run.ts';
import { buildFileDescriptor } from '../../src/session/file-descriptor.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('preserves builtin binding identity without introducing dependency references', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/re-exports/builtin-origins'), isSession: true });
  const { results, session } = await run(options);
  assert.ok(session);
  const graph = session.getGraph();
  const explorer = createGraphExplorer(graph, session.getEntryPaths());
  for (const relativePath of ['direct.ts', 'bare.ts', 'forwarded.ts']) {
    const node = graph.get(join(options.cwd, relativePath));
    assert.ok(node);
    assert.deepEqual(
      Array.from(node.imports.imports, record => [record.specifier, record.identifier, record.alias, record.filePath]),
      [
        ['node:fs', 'readFile', undefined, undefined],
        ['node:fs', 'readFile', 'readAlias', undefined],
        ['node:fs', 'default', 'fsDefault', undefined],
        ['node:fs', '*', 'fsNamespace', undefined],
      ]
    );
    assert.ok([...node.imports.imports].every(record => record.modifiers & IMPORT_FLAGS.RE_EXPORT));
  }
  assert.equal(graph.get(join(options.cwd, 'copied.ts'))?.imports.imports.size, 0);
  for (const relativePath of ['direct.ts', 'bare.ts', 'converged.ts']) {
    const descriptor = buildFileDescriptor(relativePath, options.cwd, graph, session.getEntryPaths());
    assert.ok(descriptor);
    assert.deepEqual(descriptor.exports.map(entry => entry.identifier).sort(), [
      'fsDefault',
      'fsNamespace',
      'readAlias',
      'readFile',
    ]);
  }

  for (const relativePath of ['direct.ts', 'bare.ts', 'forwarded.ts', 'converged.ts']) {
    const path = join(options.cwd, relativePath);
    assert.deepEqual(explorer.resolveExportOrigins(path, 'readFile').origins, [
      { filePath: 'node:fs', identifier: 'readFile' },
    ]);
    assert.deepEqual(explorer.resolveExportOrigins(path, 'readAlias').origins, [
      { filePath: 'node:fs', identifier: 'readFile' },
    ]);
    assert.deepEqual(explorer.resolveExportOrigins(path, 'fsNamespace').origins, [
      { filePath: 'node:fs', identifier: '*' },
    ]);
    assert.deepEqual(explorer.resolveExportOrigins(path, 'fsDefault').origins, [
      { filePath: 'node:fs', identifier: 'default' },
    ]);
  }

  assert.deepEqual([...explorer.getDependencyUsage()], []);
  assert.deepEqual(results.counters, { ...baseCounters, processed: 12, total: 12 });
});

test('resolves direct and forwarded type-only builtin namespaces to one origin', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/re-exports/builtin-origins'), isSession: true });
  const { session } = await run(options);
  assert.ok(session);
  const graph = session.getGraph();
  const explorer = createGraphExplorer(graph, session.getEntryPaths());

  for (const relativePath of ['type-direct.ts', 'type-forwarded.ts']) {
    const path = join(options.cwd, relativePath);
    const node = graph.get(path);
    assert.ok(node);
    assert.deepEqual(
      Array.from(node.imports.imports, record => [
        record.specifier,
        record.identifier,
        record.alias,
        record.isTypeOnly,
        record.modifiers,
      ]),
      [['node:fs', '*', 'fsTypes', true, 3]]
    );
    assert.deepEqual(explorer.resolveExportOrigins(path, 'fsTypes'), {
      origins: [{ filePath: 'node:fs', identifier: '*' }],
      hasExplicitExport: true,
    });
  }

  const barrel = join(options.cwd, 'type-barrel.ts');
  assert.deepEqual(explorer.resolveExportOrigins(barrel, 'fsTypes'), {
    origins: [{ filePath: 'node:fs', identifier: '*' }],
    hasExplicitExport: false,
  });
});
