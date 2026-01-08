import assert from 'node:assert/strict';
import test from 'node:test';
import { buildExportsTree } from '../../src/graph-explorer/operations/build-exports-tree.js';
import type { ModuleGraph } from '../../src/types/module-graph.js';
import { baseExport, baseFileNode, baseImportMaps } from '../helpers/baseNodeObjects.js';
import { resolve } from '../helpers/resolve.js';

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('left.ts');
const filePath2 = resolve('right.ts');
const filePath3 = resolve('pseudo.ts');
const filePath4 = resolve('index.ts');

test('Trace export through reExportNs', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    importedBy: {
      ...baseImportMaps,
      reExportNs: new Map([['namespaceR', new Set([filePath3])]]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      import: new Map([
        ['namespaceL', new Set([filePath4])],
        ['namespaceR', new Set([filePath4])],
      ]),
      refs: new Set(['namespaceL']),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
    },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath2, identifier: 'identifier' });

  assert(trace.children.length > 0);
  assert(trace.children[0].via === 'reExportNS');
  assert(trace.children[0].identifier === 'namespaceR.identifier');
});

test('Trace export through importNs (with ref)', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    importedBy: {
      ...baseImportMaps,
      importNs: new Map([['NS', new Set([filePath3])]]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps, refs: new Set(['NS.identifier']) }]]),
    },
    importedBy: {
      ...baseImportMaps,
      import: new Map([['namespaceL', new Set([filePath4])]]),
      refs: new Set(['namespaceL']),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    importedBy: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath1, identifier: 'identifier' });

  assert(trace.children.length > 0);
  const pseudoStep = trace.children[0];
  assert(pseudoStep.via === 'importNS');
  assert(pseudoStep.identifier === 'NS.identifier');
});

test('Trace export through importNs (with reExportAs)', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    importedBy: {
      ...baseImportMaps,
      importNs: new Map([['NS', new Set([filePath3])]]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [
          filePath1,
          { ...baseImportMaps, reExportAs: new Map([['NS', new Map([['namespaceL', new Set([filePath3])]])]]) },
        ],
      ]),
    },
    importedBy: {
      ...baseImportMaps,
      import: new Map([['namespaceL', new Set([filePath4])]]),
      refs: new Set(['namespaceL', 'namespaceL.fn']),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    importedBy: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath1, identifier: 'identifier' });

  assert(trace.children.length > 0);
  const pseudoStep = trace.children[0];
  assert(pseudoStep.via === 'importNS');
  assert(pseudoStep.identifier === 'NS.identifier');
});
