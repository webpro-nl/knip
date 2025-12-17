import assert from 'node:assert/strict';
import test from 'node:test';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.js';
import type { FileNode, Import, ImportMaps, ModuleGraph } from '../../src/types/module-graph.js';
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

const baseImport: Import = {
  specifier: './module-1',
  filePath: filePath1,
  identifier: 'identifier',
  isTypeOnly: false,
  pos: 0,
  line: 0,
  col: 1,
};

test('should detect simple circular dependency (A -> B -> A)', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-1', filePath: filePath1, identifier: 'bar' }]),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const cycles = explorer.findCycles(filePath1);

  assert.equal(cycles.length, 1);
  assert.ok(cycles[0].includes(filePath1));
  assert.ok(cycles[0].includes(filePath2));
});

test('should detect longer circular dependency (A -> B -> C -> A)', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath3, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-3', filePath: filePath3, identifier: 'bar' }]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-1', filePath: filePath1, identifier: 'baz' }]),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const cycles = explorer.findCycles(filePath1);

  assert.equal(cycles.length, 1);
  assert.ok(cycles[0].includes(filePath1));
  assert.ok(cycles[0].includes(filePath2));
  assert.ok(cycles[0].includes(filePath3));
});

test('should returns empty array when no cycles exist', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath3, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-3', filePath: filePath3 }]),
    },
  });

  graph.set(filePath3, { ...baseFileNode });

  const explorer = createGraphExplorer(graph, entryPaths);
  const cycles = explorer.findCycles(filePath1);

  assert.equal(cycles.length, 0);
});

test('should skip type-only imports', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-1', identifier: 'Type', isTypeOnly: true }]),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const cycles = explorer.findCycles(filePath1);

  assert.equal(cycles.length, 0);
});

test('should respect maxDepth', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath3, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-3', filePath: filePath3, identifier: 'bar' }]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath4, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-4', filePath: filePath4, identifier: 'baz' }]),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    imports: {
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-1', filePath: filePath1, identifier: 'qux' }]),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);

  const cyclesShallow = explorer.findCycles(filePath1, 2);
  assert.equal(cyclesShallow.length, 0);

  const cyclesDeep = explorer.findCycles(filePath1);
  assert.equal(cyclesDeep.length, 1);
});
