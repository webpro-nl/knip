import assert from 'node:assert/strict';
import test from 'node:test';
import { buildExportsTree } from '../../src/graph-explorer/operations/build-exports-tree.ts';
import type { ModuleGraph } from '../../src/types/module-graph.ts';
import { baseExport, baseFileNode, baseImportMaps } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('left.ts');
const filePath2 = resolve('right.ts');
const filePath3 = resolve('pseudo.ts');
const filePath4 = resolve('index.ts');
const filePath5 = resolve('cycle-a.ts');
const filePath6 = resolve('cycle-b.ts');
const filePath7 = resolve('cycle-barrel.ts');
const filePath8 = resolve('diamond-base.ts');
const filePath9 = resolve('diamond-left.ts');
const filePath10 = resolve('diamond-right.ts');
const filePath11 = resolve('diamond-top.ts');

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

test('Trace export drops the back-edge of an export star cycle', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['cycleName', { ...baseExport, identifier: 'cycleName' }]]),
    importedBy: {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([filePath5])]]),
    },
  });

  graph.set(filePath5, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      import: new Map([['cycleName', new Set([filePath4])]]),
      reExport: new Map([['*', new Set([filePath6])]]),
    },
  });

  graph.set(filePath6, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([filePath5])]]),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    importedBy: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath1, identifier: 'cycleName' });

  assert.equal(trace.children.length, 1);
  const [barrel] = trace.children;
  assert.equal(barrel.filePath, filePath5);
  assert.equal(barrel.via, 'reExportStar');
  assert.equal(barrel.identifier, 'cycleName');
  assert.equal(barrel.children.length, 1);
  const [entry] = barrel.children;
  assert.equal(entry.filePath, filePath4);
  assert.equal(entry.via, 'import');
  assert.equal(entry.isEntry, true);
  assert.equal(entry.children.length, 0);
});

test('Trace export drops a back-edge onto a node first reached through an import', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['cycleName', { ...baseExport, identifier: 'cycleName' }]]),
    importedBy: {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([filePath2, filePath5])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      import: new Map([['cycleName', new Set([filePath7])]]),
    },
  });

  graph.set(filePath5, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      reExport: new Map([['cycleName', new Set([filePath7])]]),
    },
  });

  graph.set(filePath7, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([filePath6])]]),
    },
  });

  graph.set(filePath6, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      import: new Map([['cycleName', new Set([filePath4])]]),
      reExport: new Map([['*', new Set([filePath5])]]),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    importedBy: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath1, identifier: 'cycleName' });

  assert.equal(trace.children.length, 2);
  const [right, cycleA] = trace.children;
  assert.equal(right.filePath, filePath2);
  assert.equal(cycleA.filePath, filePath5);
  assert.equal(right.children.length, 1);
  assert.equal(cycleA.children.length, 1);
  const [barrel] = right.children;
  assert.equal(barrel, cycleA.children[0]);
  assert.equal(barrel.filePath, filePath7);
  assert.equal(barrel.via, 'import');
  assert.equal(barrel.children.length, 1);
  const [cycleB] = barrel.children;
  assert.equal(cycleB.filePath, filePath6);
  assert.equal(cycleB.via, 'reExportStar');
  assert.equal(cycleB.children.length, 1);
  assert.equal(cycleB.children[0].filePath, filePath4);
  assert.equal(cycleB.children[0].isEntry, true);
});

test('Trace export keeps the shared subtree of an export star diamond under both parents', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath4]);

  graph.set(filePath8, {
    ...baseFileNode,
    exports: new Map([['DIAMOND', { ...baseExport, identifier: 'DIAMOND' }]]),
    importedBy: {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([filePath9, filePath10])]]),
    },
  });

  for (const filePath of [filePath9, filePath10]) {
    graph.set(filePath, {
      ...baseFileNode,
      importedBy: {
        ...baseImportMaps,
        reExport: new Map([['*', new Set([filePath11])]]),
      },
    });
  }

  graph.set(filePath11, {
    ...baseFileNode,
    importedBy: {
      ...baseImportMaps,
      import: new Map([['DIAMOND', new Set([filePath4])]]),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    importedBy: { ...baseImportMaps },
  });

  const [trace] = buildExportsTree(graph, entryPaths, { filePath: filePath8, identifier: 'DIAMOND' });

  assert.equal(trace.children.length, 2);
  const [left, right] = trace.children;
  assert.equal(left.filePath, filePath9);
  assert.equal(right.filePath, filePath10);
  assert.equal(left.children.length, 1);
  assert.equal(right.children.length, 1);
  const [top] = left.children;
  assert.equal(top, right.children[0]);
  assert.equal(top.filePath, filePath11);
  assert.equal(top.via, 'reExportStar');
  assert.equal(top.children.length, 1);
  assert.equal(top.children[0].filePath, filePath4);
  assert.equal(top.children[0].via, 'import');
  assert.equal(top.children[0].isEntry, true);
});
