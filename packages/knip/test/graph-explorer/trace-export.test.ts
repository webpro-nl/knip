import assert from 'node:assert/strict';
import test from 'node:test';
import { buildExportsTree } from '../../src/graph-explorer/operations/build-exports-tree.js';
import type { Export, FileNode, ImportMaps, ModuleGraph } from '../../src/types/module-graph.js';
import { resolve } from '../helpers/resolve.js';

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('left.ts');
const filePath2 = resolve('right.ts');
const filePath3 = resolve('pseudo.ts');
const filePath4 = resolve('index.ts');

const baseFileNode: FileNode = {
  imports: { internal: new Map(), external: new Set(), unresolved: new Set(), resolved: new Set(), imports: new Set() },
  exports: new Map(),
  duplicates: [],
  scripts: new Set(),
};

const baseImportMaps: ImportMaps = {
  refs: new Set(),
  imported: new Map(),
  importedAs: new Map(),
  importedNs: new Map(),
  reExported: new Map(),
  reExportedAs: new Map(),
  reExportedNs: new Map(),
};

const baseExport: Export = {
  identifier: 'identifier',
  pos: 0,
  line: 1,
  col: 14,
  type: 'unknown',
  members: [],
  jsDocTags: new Set(),
  self: [0, false],
  fixes: [],
};

test('Trace export through reExportedNs', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      reExportedNs: new Map([['namespaceR', new Set([filePath3])]]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      imported: new Map([
        ['namespaceL', new Set([filePath4])],
        ['namespaceR', new Set([filePath4])],
      ]),
      refs: new Set(['namespaceL']),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
    },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath2, identifier: 'identifier' });

  assert(trace.children.length > 0);
  assert(trace.children[0].via === 'reExportNS');
  assert(trace.children[0].identifier === 'namespaceR.identifier');
});

test('Trace export through importedNs (with ref)', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      importedNs: new Map([['NS', new Set([filePath3])]]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps, refs: new Set(['NS.identifier']) }]]),
    },
    imported: {
      ...baseImportMaps,
      imported: new Map([['namespaceL', new Set([filePath4])]]),
      refs: new Set(['namespaceL']),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    imported: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath1, identifier: 'identifier' });

  assert(trace.children.length > 0);
  const pseudoStep = trace.children[0];
  assert(pseudoStep.via === 'importNS');
  assert(pseudoStep.identifier === 'NS.identifier');
});

test('Trace export through importedNs (with reExportedAs)', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      importedNs: new Map([['NS', new Set([filePath3])]]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [
          filePath1,
          { ...baseImportMaps, reExportedAs: new Map([['NS', new Map([['namespaceL', new Set([filePath3])]])]]) },
        ],
      ]),
    },
    imported: {
      ...baseImportMaps,
      imported: new Map([['namespaceL', new Set([filePath4])]]),
      refs: new Set(['namespaceL', 'namespaceL.fn']),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    imported: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath1, identifier: 'identifier' });

  assert(trace.children.length > 0);
  const pseudoStep = trace.children[0];
  assert(pseudoStep.via === 'importNS');
  assert(pseudoStep.identifier === 'NS.identifier');
});
