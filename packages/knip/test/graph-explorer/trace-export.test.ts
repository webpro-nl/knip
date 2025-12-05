import assert from 'node:assert/strict';
import test from 'node:test';
import { buildExportsTree } from '../../src/graph-explorer/operations/build-trace-tree.js';
import type { FileNode, ImportMaps, ModuleGraph } from '../../src/types/module-graph.js';
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

test('Trace export through reExportedNs', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  // right.ts exports fn, re-exported as namespace by pseudo.ts
  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([
      [
        'fn',
        {
          identifier: 'fn',
          pos: 0,
          line: 1,
          col: 14,
          type: 'unknown',
          members: [],
          jsDocTags: new Set(),
          refs: [0, false],
        },
      ],
    ]),
    imported: {
      ...baseImportMaps,
      reExportedNs: new Map([['namespaceR', new Set([filePath3])]]),
    },
  });

  // pseudo.ts imports namespaceR, imported by index.ts
  graph.set(filePath3, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      imported: new Map([
        ['namespaceL', new Set([filePath4])],
        ['namespaceR', new Set([filePath4])],
      ]),
      refs: new Set(['namespaceL']), // Only namespaceL has ref
    },
  });

  // index.ts is entry
  graph.set(filePath4, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
    },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath2, identifier: 'fn' });

  assert(trace.children.length > 0, 'Should have trace steps');
  assert(trace.children[0].via === 'reExportNS', 'Should have via=reExportNS');
  assert(trace.children[0].identifier === 'namespaceR.fn', 'Should have correct identifier');
});

test('Trace export through importedNs (with ref)', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  // left.ts exports fn, imported as namespace by pseudo.ts
  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([
      [
        'fn',
        {
          identifier: 'fn',
          pos: 0,
          line: 1,
          col: 14,
          type: 'unknown',
          members: [],
          jsDocTags: new Set(),
          refs: [0, false],
        },
      ],
    ]),
    imported: {
      ...baseImportMaps,
      // NS is imported by pseudo.ts
      importedNs: new Map([['NS', new Set([filePath3])]]),
    },
  });

  // pseudo.ts has namespaceL imported by index.ts, WITH ref
  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps, refs: new Set(['NS.fn']) }]]),
    },
    imported: {
      ...baseImportMaps,
      imported: new Map([['namespaceL', new Set([filePath4])]]),
      refs: new Set(['namespaceL']), // Has ref because used in conditional
    },
  });

  // index.ts is entry
  graph.set(filePath4, {
    ...baseFileNode,
    imported: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath1, identifier: 'fn' });

  assert(trace.children.length > 0, 'Should have trace steps');
  // Check that we can see the path through pseudo.ts
  const pseudoStep = trace.children[0];
  assert(pseudoStep.via === 'importNS', 'Should have via=importNS');
  assert(pseudoStep.identifier === 'NS.fn', 'Should have correct identifier');
});
