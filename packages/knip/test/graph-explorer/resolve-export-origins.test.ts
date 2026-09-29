import assert from 'node:assert/strict';
import test from 'node:test';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import type { ModuleGraph } from '../../src/types/module-graph.ts';
import { baseExport, baseFileNode, baseImportMaps } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

const origin = resolve('origin.ts');
const barrel = resolve('barrel.ts');
const fruitExport = { ...baseExport, identifier: 'fruit', binding: 'fruit' };
const graph: ModuleGraph = new Map([
  [origin, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
  [
    barrel,
    {
      ...baseFileNode,
      imports: {
        ...baseFileNode.imports,
        internal: new Map([[origin, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }]]),
      },
    },
  ],
]);
const explorer = createGraphExplorer(graph, new Set());

test('Resolve a star-only barrel export to its single origin', () => {
  assert.deepEqual(explorer.resolveExportOrigins(barrel, 'fruit'), {
    origins: [{ filePath: origin, identifier: 'fruit' }],
    hasExplicitExport: false,
  });
});

test('Resolve an explicit export to itself', () => {
  assert.deepEqual(explorer.resolveExportOrigins(origin, 'fruit'), {
    origins: [{ filePath: origin, identifier: 'fruit' }],
    hasExplicitExport: true,
  });
});
