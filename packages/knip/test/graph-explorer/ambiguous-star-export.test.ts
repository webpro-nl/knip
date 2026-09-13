import assert from 'node:assert/strict';
import test from 'node:test';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import type { ModuleGraph } from '../../src/types/module-graph.ts';
import { baseExport, baseFileNode, baseImportMaps } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

test('Explicit export wins over a shadowed star export', () => {
  const winner = resolve('winner.ts');
  const shadowed = resolve('shadowed.ts');
  const barrel = resolve('barrel.ts');
  const fruitExport = { ...baseExport, identifier: 'fruit', binding: 'fruit' };
  const graph: ModuleGraph = new Map([
    [winner, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
    [shadowed, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
    [
      barrel,
      {
        ...baseFileNode,
        exports: new Map([['fruit', { ...fruitExport, isReExport: true, isBindingReExport: true }]]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [winner, { ...baseImportMaps, reExport: new Map([['fruit', new Set([barrel])]]) }],
            [shadowed, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
          ]),
        },
      },
    ],
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  assert.equal(explorer.getAmbiguousStarExport(barrel, 'fruit'), undefined);
});
