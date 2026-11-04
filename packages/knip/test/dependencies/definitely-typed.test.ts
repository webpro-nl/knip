import assert from 'node:assert/strict';
import { isBuiltin } from 'node:module';
import test from 'node:test';
import { IMPORT_FLAGS } from '../../src/constants.ts';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import { main } from '../../src/index.ts';
import { run } from '../../src/run.ts';
import { buildFileDescriptor } from '../../src/session/file-descriptor.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/definitely-typed');

test('Find unused DT @types', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['@types/unused']);
  assert(issues.devDependencies['package.json']['@types/mocha']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    processed: 1,
    total: 1,
  });
});

test('Find type imports in production dependencies (strict)', async () => {
  const options = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['type-only-production-types']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Preserve builtin namespaces while referencing DT types', async () => {
  for (const isStrict of [false, true]) {
    const options = await createOptions({ cwd, isSession: true, isProduction: isStrict, isStrict });
    const { session } = await run(options);
    assert.ok(session);
    const graph = session.getGraph();
    const entryPaths = session.getEntryPaths();
    const path = join(cwd, 'index.ts');
    const node = graph.get(path);
    assert.ok(node);
    const descriptor = buildFileDescriptor('index.ts', cwd, graph, entryPaths);
    assert.ok(descriptor);
    const explorer = createGraphExplorer(graph, entryPaths);

    assert.ok(descriptor.exports.some(entry => entry.identifier === 'files'));
    assert.deepEqual(explorer.resolveExportOrigins(path, 'files').origins, [{ filePath: 'node:fs', identifier: '*' }]);

    if (isBuiltin('ws')) {
      assert.ok(descriptor.exports.some(entry => entry.identifier === 'sockets'));
      assert.deepEqual(explorer.resolveExportOrigins(path, 'sockets'), {
        origins: [{ filePath: 'node:ws', identifier: '*' }],
        hasExplicitExport: true,
      });
      const binding = [...node.imports.imports].find(record => record.alias === 'sockets');
      assert.ok(binding);
      assert.equal(binding.specifier, 'node:ws');
      assert.equal(binding.isTypeOnly, true);
      assert.ok(binding.modifiers & IMPORT_FLAGS.RE_EXPORT);
    }

    assert.equal(
      [...node.imports.external].some(record => record.specifier === 'ws'),
      !isStrict
    );
  }
});
