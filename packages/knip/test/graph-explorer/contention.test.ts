import assert from 'node:assert/strict';
import test from 'node:test';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.js';
import type { Export, FileNode, ImportMaps, ModuleGraph } from '../../src/types/module-graph.js';
import { resolve } from '../helpers/resolve.js';

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('module-1.ts');
const filePath2 = resolve('module-2.ts');
const filePath3 = resolve('module-3.ts');
const filePath4 = resolve('module-4.ts');

const baseFileNode: FileNode = {
  imports: { internal: new Map(), external: new Set(), unresolved: new Set(), resolved: new Set(), imports: new Set() },
  exports: new Map(),
  duplicates: [],
  scripts: new Set(),
  traceRefs: new Set(),
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
  col: 0,
  type: 'unknown',
  members: [],
  jsDocTags: new Set(),
  refs: [0, false],
  fixes: [],
};

test('should detect branching (export re-exported through multiple paths)', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath3])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imports: {
      internal: new Map([
        [filePath2, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath4])]]) }],
        [filePath3, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath4])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const contention = explorer.getContention(filePath4);

  const fooContention = contention.get('identifier');
  assert.ok(fooContention);
  assert.ok(fooContention.branching.length > 0);
});

test('should detect conflict (same identifier defined in multiple files)', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(filePath3, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath3])]]) }],
        [filePath2, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath3])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const contention = explorer.getContention(filePath3);

  const fooContention = contention.get('identifier');
  assert.ok(fooContention);
  assert.ok(fooContention.conflict.length >= 2);
  assert.ok(fooContention.conflict.includes(filePath1));
  assert.ok(fooContention.conflict.includes(filePath2));
});

test('should return empty map when no contention exists', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', { ...baseExport, isReExport: true }]]),
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const contention = explorer.getContention(filePath2);

  assert.equal(contention.size, 0);
});

test('should ignore default exports', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['default', { ...baseExport, identifier: 'default' }]]),
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['default', { ...baseExport, identifier: 'default' }]]),
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const contention1 = explorer.getContention(filePath1);
  const contention2 = explorer.getContention(filePath2);

  assert.equal(contention1.has('default'), false);
  assert.equal(contention2.has('default'), false);
});

test('should return empty map for non-existent file', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  const explorer = createGraphExplorer(graph, entryPaths);
  const contention = explorer.getContention(resolve('non-existent.ts'));

  assert.equal(contention.size, 0);
});

test('should detect conflict through star re-exports chain', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath3, {
    ...baseFileNode,
    exports: new Map([['CONFLICT', { ...baseExport, identifier: 'CONFLICT' }]]),
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['CONFLICT', { ...baseExport, identifier: 'CONFLICT' }]]),
    imports: {
      internal: new Map([[filePath3, { ...baseImportMaps, reExported: new Map([['*', new Set([filePath2])]]) }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['CONFLICT', { ...baseExport, identifier: 'CONFLICT' }]]),
    imports: {
      internal: new Map([[filePath2, { ...baseImportMaps, reExported: new Map([['*', new Set([filePath1])]]) }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  const file3Node = graph.get(filePath3);
  if (file3Node) {
    file3Node.imported = {
      ...baseImportMaps,
      reExported: new Map([['*', new Set([filePath2])]]),
    };
  }

  const file2Node = graph.get(filePath2);
  if (file2Node) {
    file2Node.imported = {
      ...baseImportMaps,
      reExported: new Map([['*', new Set([filePath1])]]),
    };
  }

  const explorer = createGraphExplorer(graph, entryPaths);

  const contention1 = explorer.getContention(filePath1);
  const conflict1 = contention1.get('CONFLICT');
  assert.ok(conflict1);
  assert.equal(conflict1.conflict.length, 3);
  assert.ok(conflict1.conflict.includes(filePath1));
  assert.ok(conflict1.conflict.includes(filePath2));
  assert.ok(conflict1.conflict.includes(filePath3));

  const contention2 = explorer.getContention(filePath2);
  const conflict2 = contention2.get('CONFLICT');
  assert.ok(conflict2);
  assert.equal(conflict2.conflict.length, 3);
  assert.ok(conflict2.conflict.includes(filePath1));
  assert.ok(conflict2.conflict.includes(filePath2));
  assert.ok(conflict2.conflict.includes(filePath3));

  const contention3 = explorer.getContention(filePath3);
  const conflict3 = contention3.get('CONFLICT');
  assert.ok(conflict3);
  assert.equal(conflict3.conflict.length, 3);
  assert.ok(conflict3.conflict.includes(filePath1));
  assert.ok(conflict3.conflict.includes(filePath2));
  assert.ok(conflict3.conflict.includes(filePath3));
});

test('should detect conflict from source file aggregated by consumer', () => {
  const fileA = resolve('a.ts');
  const fileB = resolve('b.ts');
  const fileC = resolve('c.ts');
  const indexFile = resolve('index.ts');

  const graph = createGraph();
  const entryPaths = new Set([indexFile]);

  graph.set(fileA, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(fileB, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(fileC, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(indexFile, {
    ...baseFileNode,
    exports: new Map([['identifier', { ...baseExport, isReExport: true }]]),
    imports: {
      internal: new Map([
        [fileA, { ...baseImportMaps, reExported: new Map([['*', new Set([indexFile])]]) }],
        [fileB, { ...baseImportMaps, reExported: new Map([['*', new Set([indexFile])]]) }],
        [fileC, { ...baseImportMaps, reExported: new Map([['*', new Set([indexFile])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  const fileANode = graph.get(fileA);
  if (fileANode) {
    fileANode.imported = {
      ...baseImportMaps,
      reExported: new Map([['*', new Set([indexFile])]]),
    };
  }

  const fileBNode = graph.get(fileB);
  if (fileBNode) {
    fileBNode.imported = {
      ...baseImportMaps,
      reExported: new Map([['*', new Set([indexFile])]]),
    };
  }

  const fileCNode = graph.get(fileC);
  if (fileCNode) {
    fileCNode.imported = {
      ...baseImportMaps,
      reExported: new Map([['*', new Set([indexFile])]]),
    };
  }

  const explorer = createGraphExplorer(graph, entryPaths);

  const contentionIndex = explorer.getContention(indexFile);
  const conflictIndex = contentionIndex.get('identifier');
  assert.ok(conflictIndex);
  assert.equal(conflictIndex.conflict.length, 3);
  assert.ok(conflictIndex.conflict.includes(fileA));
  assert.ok(conflictIndex.conflict.includes(fileB));
  assert.ok(conflictIndex.conflict.includes(fileC));

  const contentionA = explorer.getContention(fileA);
  const conflictA = contentionA.get('identifier');
  assert.ok(conflictA);
  assert.equal(conflictA.conflict.length, 3);
  assert.ok(conflictA.conflict.includes(fileA));
  assert.ok(conflictA.conflict.includes(fileB));
  assert.ok(conflictA.conflict.includes(fileC));

  const contentionB = explorer.getContention(fileB);
  const conflictB = contentionB.get('identifier');
  assert.ok(conflictB);
  assert.equal(conflictB.conflict.length, 3);

  const contentionC = explorer.getContention(fileC);
  const conflictC = contentionC.get('identifier');
  assert.ok(conflictC);
  assert.equal(conflictC.conflict.length, 3);
});
