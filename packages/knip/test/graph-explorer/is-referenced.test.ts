import assert from 'node:assert/strict';
import test from 'node:test';
import { isReferenced } from '../../src/graph-explorer/operations/is-referenced.ts';
import type { ModuleGraph } from '../../src/types/module-graph.ts';
import { baseFileNode, baseImportMaps } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

const sourcePath = resolve('source.ts');
const consumerPath = resolve('consumer.ts');
const barrelPath = resolve('barrel.ts');
const entryPath = resolve('entry.ts');

test('returns an entry re-export alongside an internal reference', () => {
  const graph: ModuleGraph = new Map([
    [
      sourcePath,
      {
        ...baseFileNode,
        importedBy: {
          ...baseImportMaps,
          import: new Map([['identifier', new Set([consumerPath])]]),
          reExport: new Map([['identifier', new Set([barrelPath])]]),
        },
      },
    ],
    [
      barrelPath,
      {
        ...baseFileNode,
        importedBy: {
          ...baseImportMaps,
          reExport: new Map([['identifier', new Set([entryPath])]]),
        },
      },
    ],
    [consumerPath, { ...baseFileNode }],
    [entryPath, { ...baseFileNode }],
  ]);

  assert.deepEqual(isReferenced(graph, new Set([entryPath]), sourcePath, 'identifier', { traverseEntries: false }), [
    true,
    entryPath,
  ]);
});

test('does not treat an ordinary entry import as a public export', () => {
  const graph: ModuleGraph = new Map([
    [
      sourcePath,
      {
        ...baseFileNode,
        importedBy: {
          ...baseImportMaps,
          import: new Map([['identifier', new Set([entryPath])]]),
        },
      },
    ],
    [entryPath, { ...baseFileNode }],
  ]);

  assert.deepEqual(isReferenced(graph, new Set([entryPath]), sourcePath, 'identifier', { traverseEntries: false }), [
    true,
    undefined,
  ]);
});
