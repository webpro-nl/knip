import assert from 'node:assert/strict';
import test from 'node:test';
import type { ModuleGraph } from '../../src/types/module-graph.ts';
import { addValue, createFileNode, createImports, updateImportMap } from '../../src/util/module-graph.ts';

test('Reverse index does not share identifier sets with the importing nodes', () => {
  const graph: ModuleGraph = new Map();
  const createImporter = (filePath: string) => {
    const node = createFileNode();
    const importMaps = createImports();
    addValue(importMaps.import, 'apple', filePath);
    node.imports.internal.set('/orchard/fruits.ts', importMaps);
    return node;
  };

  const first = createImporter('/orchard/first.ts');
  const second = createImporter('/orchard/second.ts');
  updateImportMap(first, first.imports.internal, graph);
  updateImportMap(second, second.imports.internal, graph);

  assert.deepEqual(
    [...(graph.get('/orchard/fruits.ts')?.importedBy?.import.get('apple') ?? [])],
    ['/orchard/first.ts', '/orchard/second.ts']
  );
  assert.deepEqual(
    [...(first.imports.internal.get('/orchard/fruits.ts')?.import.get('apple') ?? [])],
    ['/orchard/first.ts']
  );
});
