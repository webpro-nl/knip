import assert from 'node:assert/strict';
import test from 'node:test';
import { IMPORT_FLAGS } from '../../src/constants.ts';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import type { ModuleGraph } from '../../src/types/module-graph.ts';
import { baseFileNode, baseImportMaps, getBaseImport } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('module-1.ts');
const filePath2 = resolve('module-2.ts');
const filePath3 = resolve('module-3.ts');
const filePath4 = resolve('module-4.ts');

const baseImport = getBaseImport(filePath1);

test('should detect simple circular dependency (A -> B -> A)', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
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
      ...baseFileNode.imports,
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath3, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-3', filePath: filePath3, identifier: 'bar' }]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
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
      ...baseFileNode.imports,
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath3, { ...baseImportMaps }]]),
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
      ...baseFileNode.imports,
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
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
      ...baseFileNode.imports,
      internal: new Map([[filePath2, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath3, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-3', filePath: filePath3, identifier: 'bar' }]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath4, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-4', filePath: filePath4, identifier: 'baz' }]),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-1', filePath: filePath1, identifier: 'qux' }]),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);

  const cyclesShallow = explorer.findCycles(filePath1, 2);
  assert.equal(cyclesShallow.length, 0);

  const cyclesDeep = explorer.findCycles(filePath1);
  assert.equal(cyclesDeep.length, 1);
});

const runtimeImport = (filePath: string, specifier: string, identifier?: string) => ({
  ...baseImport,
  specifier,
  filePath,
  ...(identifier ? { identifier } : {}),
});

const node = (...imports: ReturnType<typeof runtimeImport>[]) => ({
  ...baseFileNode,
  imports: {
    ...baseFileNode.imports,
    internal: new Map(imports.map(i => [i.filePath, { ...baseImportMaps }])),
    imports: new Set(imports),
  },
});

const key = (cycle: string[]) => cycle.join('|');

test('findAllCycles: detects a single cycle once, regardless of member count', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath2, './module-2')));
  graph.set(filePath2, node(runtimeImport(filePath3, './module-3')));
  graph.set(filePath3, node(runtimeImport(filePath1, './module-1')));

  const cycles = createGraphExplorer(graph, new Set()).findAllCycles();

  assert.equal(cycles.length, 1);
  assert.deepEqual(cycles[0], [filePath1, filePath2, filePath3, filePath1]);
});

test('findAllCycles: detects multiple independent cycles sharing a node', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath2, './module-2'), runtimeImport(filePath3, './module-3')));
  graph.set(filePath2, node(runtimeImport(filePath1, './module-1')));
  graph.set(filePath3, node(runtimeImport(filePath1, './module-1')));

  const cycles = createGraphExplorer(graph, new Set()).findAllCycles();
  const keys = new Set(cycles.map(key));

  assert.equal(cycles.length, 2);
  assert.ok(keys.has(key([filePath1, filePath2, filePath1])));
  assert.ok(keys.has(key([filePath1, filePath3, filePath1])));
});

test('findAllCycles: skips type-only edges', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath2, './module-2')));
  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      imports: new Set([{ ...baseImport, specifier: './module-1', identifier: 'Type', isTypeOnly: true }]),
    },
  });

  const cycles = createGraphExplorer(graph, new Set()).findAllCycles();

  assert.equal(cycles.length, 0);
});

test('findAllCycles: skips entry reference edges', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath2, './module-2')));
  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      imports: new Set([
        { ...baseImport, specifier: './module-1', filePath: filePath1, modifiers: IMPORT_FLAGS.ENTRY },
      ]),
    },
  });

  const cycles = createGraphExplorer(graph, new Set()).findAllCycles();

  assert.equal(cycles.length, 0);
});

test('findAllCycles: skips dynamic import edges', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath2, './module-2')));
  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      imports: new Set([
        { ...baseImport, specifier: './module-1', filePath: filePath1, modifiers: IMPORT_FLAGS.DYNAMIC },
      ]),
    },
  });

  const cycles = createGraphExplorer(graph, new Set()).findAllCycles();

  assert.equal(cycles.length, 0);
});

test('findAllCycles: has no depth cap (finds cycle deeper than findCycles maxDepth of 16)', () => {
  const graph = createGraph();
  const deep = Array.from({ length: 20 }, (_, i) => resolve(`deep-${i}.ts`));
  for (let i = 0; i < deep.length; i++) {
    const nextPath = deep[(i + 1) % deep.length];
    graph.set(deep[i], node(runtimeImport(nextPath, `./deep-${(i + 1) % deep.length}`)));
  }

  const explorer = createGraphExplorer(graph, new Set());
  assert.equal(explorer.findCycles(deep[0]).length, 0);
  assert.equal(explorer.findAllCycles().length, 1);
});

test('findAllCycles: returns empty array for an acyclic graph', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath2, './module-2')));
  graph.set(filePath2, node(runtimeImport(filePath3, './module-3')));
  graph.set(filePath3, { ...baseFileNode });

  assert.equal(createGraphExplorer(graph, new Set()).findAllCycles().length, 0);
});

test('findAllCycles: counts an edge that is imported both type-only and at runtime', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath2, './module-2')));
  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath1, { ...baseImportMaps }]]),
      imports: new Set([
        { ...baseImport, specifier: './module-1', filePath: filePath1, identifier: 'Type', isTypeOnly: true },
        { ...baseImport, specifier: './module-1', filePath: filePath1, identifier: 'value' },
      ]),
    },
  });

  const cycles = createGraphExplorer(graph, new Set()).findAllCycles();

  assert.equal(cycles.length, 1);
  assert.deepEqual(cycles[0], [filePath1, filePath2, filePath1]);
});

test('findAllCycles: detects a self-import as a cycle', () => {
  const graph = createGraph();
  graph.set(filePath1, node(runtimeImport(filePath1, './module-1')));

  const cycles = createGraphExplorer(graph, new Set()).findAllCycles();

  assert.equal(cycles.length, 1);
  assert.deepEqual(cycles[0], [filePath1, filePath1]);
});
