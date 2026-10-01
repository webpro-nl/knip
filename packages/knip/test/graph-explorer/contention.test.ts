import assert from 'node:assert/strict';
import test from 'node:test';
import { IMPORT_FLAGS } from '../../src/constants.ts';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import { getAmbiguousStarExport } from '../../src/graph-explorer/operations/get-ambiguous-star-export.ts';
import type { ModuleGraph } from '../../src/types/module-graph.ts';
import { baseExport, baseFileNode, baseImportMaps, getBaseImport } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('module-1.ts');
const filePath2 = resolve('module-2.ts');
const filePath3 = resolve('module-3.ts');
const filePath4 = resolve('module-4.ts');

const starMaps = (...consumers: string[]) => ({
  ...baseImportMaps,
  reExport: new Map([['*', new Set(consumers)]]),
});

const fruitExport = { ...baseExport, identifier: 'fruit', binding: 'fruit' };

const starNode = (self: string, sources: string[], consumers: string[]) => ({
  ...baseFileNode,
  imports: { ...baseFileNode.imports, internal: new Map(sources.map(source => [source, starMaps(self)])) },
  importedBy: starMaps(...consumers),
});

test('reports converged when binding re-exports of one origin meet', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', { ...baseExport, isReExport: true, isBindingReExport: true }]]),
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExport: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    exports: new Map([['identifier', { ...baseExport, isReExport: true, isBindingReExport: true }]]),
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExport: new Map([['identifier', new Set([filePath3])]]) }],
      ]),
    },
  });

  graph.set(filePath4, {
    ...baseFileNode,
    exports: new Map([['identifier', { ...baseExport, isReExport: true, isBindingReExport: true }]]),
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [filePath2, { ...baseImportMaps, reExport: new Map([['identifier', new Set([filePath4])]]) }],
        [filePath3, { ...baseImportMaps, reExport: new Map([['identifier', new Set([filePath4])]]) }],
      ]),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const contention = explorer.getContention(filePath4);

  const fooContention = contention.get('identifier');
  assert.ok(fooContention);
  assert.equal(fooContention.sites[0].kind, 'converged');
  assert.deepEqual(fooContention.branching, [filePath4]);
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
    exports: new Map([['identifier', { ...baseExport, isReExport: true, isBindingReExport: true }]]),
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExport: new Map([['identifier', new Set([filePath3])]]) }],
        [filePath2, { ...baseImportMaps, reExport: new Map([['identifier', new Set([filePath3])]]) }],
      ]),
    },
  });

  const explorer = createGraphExplorer(graph, entryPaths);
  const contention = explorer.getContention(filePath3);

  const fooContention = contention.get('identifier');
  assert.ok(fooContention);
  assert.equal(fooContention.sites[0].kind, 'ambiguous');
  assert.deepEqual(fooContention.conflict, [filePath1, filePath2]);
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
    exports: new Map([['identifier', { ...baseExport, isReExport: true, isBindingReExport: true }]]),
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExport: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
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

test('reports one level of shadowing per file', () => {
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
      ...baseFileNode.imports,
      internal: new Map([[filePath3, { ...baseImportMaps, reExport: new Map([['*', new Set([filePath2])]]) }]]),
    },
  });

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['CONFLICT', { ...baseExport, identifier: 'CONFLICT' }]]),
    imports: {
      ...baseFileNode.imports,
      internal: new Map([[filePath2, { ...baseImportMaps, reExport: new Map([['*', new Set([filePath1])]]) }]]),
    },
  });

  const file3Node = graph.get(filePath3);
  if (file3Node) {
    file3Node.importedBy = {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([filePath2])]]),
    };
  }

  const file2Node = graph.get(filePath2);
  if (file2Node) {
    file2Node.importedBy = {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([filePath1])]]),
    };
  }

  const explorer = createGraphExplorer(graph, entryPaths);

  const contention1 = explorer.getContention(filePath1);
  const conflict1 = contention1.get('CONFLICT');
  assert.ok(conflict1);
  assert.equal(conflict1.sites[0].kind, 'shadowed');
  assert.deepEqual(conflict1.conflict, [filePath1, filePath2]);

  const contention2 = explorer.getContention(filePath2);
  const conflict2 = contention2.get('CONFLICT');
  assert.ok(conflict2);
  assert.equal(conflict2.sites[0].kind, 'shadowed');
  assert.deepEqual(conflict2.conflict, [filePath1, filePath2, filePath3]);

  const contention3 = explorer.getContention(filePath3);
  const conflict3 = contention3.get('CONFLICT');
  assert.ok(conflict3);
  assert.equal(conflict3.sites[0].kind, 'shadowed');
  assert.deepEqual(conflict3.conflict, [filePath2, filePath3]);
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
    exports: new Map(),
    imports: {
      ...baseFileNode.imports,
      internal: new Map([
        [fileA, { ...baseImportMaps, reExport: new Map([['*', new Set([indexFile])]]) }],
        [fileB, { ...baseImportMaps, reExport: new Map([['*', new Set([indexFile])]]) }],
        [fileC, { ...baseImportMaps, reExport: new Map([['*', new Set([indexFile])]]) }],
      ]),
    },
  });

  const fileANode = graph.get(fileA);
  if (fileANode) {
    fileANode.importedBy = {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([indexFile])]]),
    };
  }

  const fileBNode = graph.get(fileB);
  if (fileBNode) {
    fileBNode.importedBy = {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([indexFile])]]),
    };
  }

  const fileCNode = graph.get(fileC);
  if (fileCNode) {
    fileCNode.importedBy = {
      ...baseImportMaps,
      reExport: new Map([['*', new Set([indexFile])]]),
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

test('reports ambiguous when star sources resolve to distinct bindings', () => {
  const fruits = resolve('fruits.ts');
  const vegetables = resolve('vegetables.ts');
  const barrel = resolve('barrel.ts');
  const fooExport = { ...baseExport, identifier: 'foo', binding: 'foo' };

  const graph: ModuleGraph = new Map([
    [fruits, { ...baseFileNode, exports: new Map([['foo', fooExport]]) }],
    [vegetables, { ...baseFileNode, exports: new Map([['foo', fooExport]]) }],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [fruits, starMaps(barrel)],
            [vegetables, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const contention = createGraphExplorer(graph, new Set()).getContention(barrel);
  const foo = contention.get('foo');

  assert.ok(foo);
  assert.equal(foo.sites[0].kind, 'ambiguous');
  assert.deepEqual(foo.branching, []);
  assert.deepEqual(foo.conflict, [fruits, vegetables]);
  assert.deepEqual(foo.sites, [
    {
      kind: 'ambiguous',
      filePath: barrel,
      identifier: 'foo',
      origins: [
        { filePath: fruits, identifier: 'foo', line: 1, col: 0 },
        { filePath: vegetables, identifier: 'foo', line: 1, col: 0 },
      ],
      sources: [fruits, vegetables],
    },
  ]);
});

test('reports ambiguous when a binding re-export forwards an ambiguous name', () => {
  const fruits = resolve('fruits.ts');
  const vegetables = resolve('vegetables.ts');
  const barrel = resolve('barrel.ts');
  const forward = resolve('forward.ts');
  const fooExport = { ...baseExport, identifier: 'foo', binding: 'foo' };

  const graph: ModuleGraph = new Map([
    [fruits, { ...baseFileNode, exports: new Map([['foo', fooExport]]) }],
    [vegetables, { ...baseFileNode, exports: new Map([['foo', fooExport]]) }],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [fruits, starMaps(barrel)],
            [vegetables, starMaps(barrel)],
          ]),
        },
      },
    ],
    [
      forward,
      {
        ...baseFileNode,
        exports: new Map([['foo', { ...fooExport, isReExport: true, isBindingReExport: true }]]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([[barrel, { ...baseImportMaps, reExport: new Map([['foo', new Set([forward])]]) }]]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const foo = explorer.getContention(forward).get('foo');

  assert.ok(foo);
  assert.equal(foo.sites[0].kind, 'ambiguous');
  assert.equal(foo.sites.length, 1);
  assert.equal(foo.sites[0].filePath, forward);
  assert.deepEqual(foo.sites[0].origins, [
    { filePath: fruits, identifier: 'foo', line: 1, col: 0 },
    { filePath: vegetables, identifier: 'foo', line: 1, col: 0 },
  ]);
  assert.equal(getAmbiguousStarExport(explorer.resolveExportOrigins(forward, 'foo'), 'foo'), undefined);
});

test('reports shadowed with the explicit winner and the hidden candidate', () => {
  const winner = resolve('winner.ts');
  const shadowed = resolve('shadowed.ts');
  const barrel = resolve('explicit-barrel.ts');

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
            [shadowed, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const fruit = createGraphExplorer(graph, new Set()).getContention(barrel).get('fruit');

  assert.ok(fruit);
  assert.equal(fruit.sites[0].kind, 'shadowed');
  assert.deepEqual(fruit.branching, []);
  assert.deepEqual(fruit.conflict, [shadowed, winner]);
  assert.deepEqual(fruit.sites, [
    {
      kind: 'shadowed',
      filePath: barrel,
      identifier: 'fruit',
      origins: [{ filePath: shadowed, identifier: 'fruit', line: 1, col: 0 }],
      sources: [shadowed],
      line: 1,
      col: 0,
      winner: { filePath: winner, identifier: 'fruit', line: 1, col: 0 },
    },
  ]);
});

test('reports shadowed when a namespace re-export wins', () => {
  const origin = resolve('origin.ts');
  const shadowed = resolve('shadowed.ts');
  const barrel = resolve('namespace-explicit-barrel.ts');

  const graph: ModuleGraph = new Map([
    [origin, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
    [shadowed, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [origin, { ...baseImportMaps, reExportNs: new Map([['fruit', new Set([barrel])]]) }],
            [shadowed, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const fruit = createGraphExplorer(graph, new Set()).getContention(barrel).get('fruit');

  assert.ok(fruit);
  assert.equal(fruit.sites[0].kind, 'shadowed');
  assert.deepEqual(fruit.sites, [
    {
      kind: 'shadowed',
      filePath: barrel,
      identifier: 'fruit',
      origins: [{ filePath: shadowed, identifier: 'fruit', line: 1, col: 0 }],
      sources: [shadowed],
      winner: { filePath: origin, identifier: '*' },
    },
  ]);
});

test('reports converged when two star sources deliver one binding', () => {
  const base = resolve('diamond-base.ts');
  const left = resolve('diamond-left.ts');
  const right = resolve('diamond-right.ts');
  const top = resolve('diamond-top.ts');

  const graph: ModuleGraph = new Map([
    [base, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]), importedBy: starMaps(left, right) }],
    [
      left,
      {
        ...baseFileNode,
        imports: { ...baseFileNode.imports, internal: new Map([[base, starMaps(left)]]) },
        importedBy: starMaps(top),
      },
    ],
    [
      right,
      {
        ...baseFileNode,
        imports: { ...baseFileNode.imports, internal: new Map([[base, starMaps(right)]]) },
        importedBy: starMaps(top),
      },
    ],
    [
      top,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [left, starMaps(top)],
            [right, starMaps(top)],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const fruit = explorer.getContention(top).get('fruit');

  assert.ok(fruit);
  assert.equal(fruit.sites[0].kind, 'converged');
  assert.deepEqual(fruit.branching, [top]);
  assert.deepEqual(fruit.conflict, []);
  assert.deepEqual(fruit.sites, [
    {
      kind: 'converged',
      filePath: top,
      identifier: 'fruit',
      origins: [{ filePath: base, identifier: 'fruit', line: 1, col: 0 }],
      sources: [left, right],
    },
  ]);

  const fromBase = explorer.getContention(base).get('fruit');
  assert.ok(fromBase);
  assert.equal(fromBase.sites.length, 1);
  assert.equal(fromBase.sites[0].filePath, top);
});

test('does not count a star source without a resolvable origin as a converging path', () => {
  const origin = resolve('origin.ts');
  const relay = resolve('relay.ts');
  const empty = resolve('empty.ts');
  const emptyRelay = resolve('empty-relay.ts');
  const barrel = resolve('barrel.ts');
  const bindingReExport = { ...fruitExport, isReExport: true, isBindingReExport: true };

  const graph: ModuleGraph = new Map([
    [origin, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
    [empty, { ...baseFileNode }],
    [
      relay,
      {
        ...baseFileNode,
        exports: new Map([['fruit', bindingReExport]]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([[origin, { ...baseImportMaps, reExport: new Map([['fruit', new Set([relay])]]) }]]),
        },
      },
    ],
    [
      emptyRelay,
      {
        ...baseFileNode,
        exports: new Map([['fruit', bindingReExport]]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([[empty, { ...baseImportMaps, reExport: new Map([['fruit', new Set([emptyRelay])]]) }]]),
        },
      },
    ],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [relay, starMaps(barrel)],
            [emptyRelay, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());

  assert.equal(explorer.getContention(barrel).get('fruit'), undefined);
  assert.deepEqual(explorer.resolveExportOrigins(barrel, 'fruit'), {
    origins: [{ filePath: origin, identifier: 'fruit' }],
    hasExplicitExport: false,
  });
});

test('reports the ambiguous consumer site from each origin file', () => {
  const fruits = resolve('fruits.ts');
  const vegetables = resolve('vegetables.ts');
  const barrel = resolve('barrel.ts');
  const outer = resolve('outer-barrel.ts');
  const fooExport = { ...baseExport, identifier: 'foo', binding: 'foo' };

  const graph: ModuleGraph = new Map([
    [fruits, { ...baseFileNode, exports: new Map([['foo', fooExport]]), importedBy: starMaps(barrel) }],
    [vegetables, { ...baseFileNode, exports: new Map([['foo', fooExport]]), importedBy: starMaps(barrel) }],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [fruits, starMaps(barrel)],
            [vegetables, starMaps(barrel)],
          ]),
        },
        importedBy: starMaps(outer),
      },
    ],
    [outer, { ...baseFileNode, imports: { ...baseFileNode.imports, internal: new Map([[barrel, starMaps(outer)]]) } }],
  ]);

  const explorer = createGraphExplorer(graph, new Set());

  for (const definition of [fruits, vegetables]) {
    const foo = explorer.getContention(definition).get('foo');
    assert.ok(foo);
    assert.equal(foo.sites[0].kind, 'ambiguous');
    assert.deepEqual(foo.conflict, [fruits, vegetables]);
    assert.equal(foo.sites.length, 1);
    assert.equal(foo.sites[0].filePath, barrel);
    assert.equal(foo.sites[0].identifier, 'foo');
  }

  assert.equal(explorer.getContention(outer).get('foo')?.sites[0].filePath, outer);
});

test('follows alias renames when walking consumers', () => {
  const bindings = resolve('bindings.ts');
  const aliasLeft = resolve('alias-left.ts');
  const aliasRight = resolve('alias-right.ts');
  const aliasBarrel = resolve('alias-barrel.ts');
  const splitExport = {
    ...baseExport,
    identifier: 'split',
    binding: 'split',
    isReExport: true,
    isBindingReExport: true,
  };

  const graph: ModuleGraph = new Map([
    [
      bindings,
      {
        ...baseFileNode,
        exports: new Map([
          ['apple', { ...baseExport, identifier: 'apple', binding: 'apple' }],
          ['pear', { ...baseExport, identifier: 'pear', binding: 'pear' }],
        ]),
        importedBy: {
          ...baseImportMaps,
          reExportAs: new Map([
            ['apple', new Map([['split', new Set([aliasLeft])]])],
            ['pear', new Map([['split', new Set([aliasRight])]])],
          ]),
        },
      },
    ],
    [
      aliasLeft,
      {
        ...baseFileNode,
        exports: new Map([['split', splitExport]]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [
              bindings,
              { ...baseImportMaps, reExportAs: new Map([['apple', new Map([['split', new Set([aliasLeft])]])]]) },
            ],
          ]),
        },
        importedBy: starMaps(aliasBarrel),
      },
    ],
    [
      aliasRight,
      {
        ...baseFileNode,
        exports: new Map([['split', splitExport]]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [
              bindings,
              { ...baseImportMaps, reExportAs: new Map([['pear', new Map([['split', new Set([aliasRight])]])]]) },
            ],
          ]),
        },
        importedBy: starMaps(aliasBarrel),
      },
    ],
    [
      aliasBarrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [aliasLeft, starMaps(aliasBarrel)],
            [aliasRight, starMaps(aliasBarrel)],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const apple = explorer.getContention(bindings).get('apple');

  assert.ok(apple);
  assert.equal(apple.sites[0].kind, 'ambiguous');
  assert.equal(apple.sites.length, 1);
  assert.equal(apple.sites[0].filePath, aliasBarrel);
  assert.equal(apple.sites[0].identifier, 'split');
  assert.deepEqual(apple.sites[0].origins, [
    { filePath: bindings, identifier: 'apple', line: 1, col: 0 },
    { filePath: bindings, identifier: 'pear', line: 1, col: 0 },
  ]);
  assert.equal(explorer.getContention(aliasBarrel).get('apple'), undefined);
});

test('stops at namespace re-exports', () => {
  const host = resolve('host.ts');
  const worker = resolve('worker.ts');
  const parallelHost = resolve('parallel-host.ts');
  const parallelWorker = resolve('parallel-worker.ts');
  const harness = resolve('harness.ts');
  const startExport = { ...baseExport, identifier: 'start', binding: 'start' };

  const graph: ModuleGraph = new Map([
    [host, { ...baseFileNode, exports: new Map([['start', startExport]]), importedBy: starMaps(parallelHost) }],
    [worker, { ...baseFileNode, exports: new Map([['start', startExport]]), importedBy: starMaps(parallelWorker) }],
    [
      parallelHost,
      {
        ...baseFileNode,
        imports: { ...baseFileNode.imports, internal: new Map([[host, starMaps(parallelHost)]]) },
        importedBy: { ...baseImportMaps, reExportNs: new Map([['Host', new Set([harness])]]) },
      },
    ],
    [
      parallelWorker,
      {
        ...baseFileNode,
        imports: { ...baseFileNode.imports, internal: new Map([[worker, starMaps(parallelWorker)]]) },
        importedBy: { ...baseImportMaps, reExportNs: new Map([['Host', new Set([harness])]]) },
      },
    ],
    [
      harness,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [parallelHost, { ...baseImportMaps, reExportNs: new Map([['Host', new Set([harness])]]) }],
            [parallelWorker, { ...baseImportMaps, reExportNs: new Map([['Host', new Set([harness])]]) }],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());

  assert.equal(explorer.getContention(harness).get('Host')?.sites[0].kind, 'ambiguous');
  assert.equal(explorer.getContention(host).size, 0);
  assert.equal(explorer.getContention(parallelHost).size, 0);
});

test('shares export tables across identifiers and describes', () => {
  const base = resolve('base.ts');
  const left = resolve('left.ts');
  const right = resolve('right.ts');
  const extra = resolve('extra.ts');
  const barrel = resolve('barrel.ts');

  const graph: ModuleGraph = new Map([
    [base, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
    [
      extra,
      {
        ...baseFileNode,
        exports: new Map([['vegetable', { ...baseExport, identifier: 'vegetable', binding: 'vegetable' }]]),
      },
    ],
    [left, { ...baseFileNode, imports: { ...baseFileNode.imports, internal: new Map([[base, starMaps(left)]]) } }],
    [right, { ...baseFileNode, imports: { ...baseFileNode.imports, internal: new Map([[base, starMaps(right)]]) } }],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [left, starMaps(barrel)],
            [right, starMaps(barrel)],
            [extra, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const counter = { reads: 0 };
  const countedGraph = new Proxy(graph, {
    get(target, property) {
      if (property === 'get') {
        return (filePath: string) => {
          counter.reads++;
          return target.get(filePath);
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });

  const explorer = createGraphExplorer(countedGraph, new Set());

  assert.equal(explorer.getContention(barrel).get('fruit')?.sites[0].kind, 'converged');
  assert.equal(counter.reads, 7);

  counter.reads = 0;
  assert.equal(explorer.getContention(barrel).get('fruit')?.sites[0].kind, 'converged');
  assert.equal(counter.reads, 6);

  explorer.invalidateCache();
  counter.reads = 0;
  assert.equal(explorer.getContention(barrel).get('fruit')?.sites[0].kind, 'converged');
  assert.equal(counter.reads, 7);
});

test('reports the same sites on every call when branches meet in a re-export cycle', () => {
  const leafApple = resolve('leaf-apple.ts');
  const leafBerry = resolve('leaf-berry.ts');
  const cycleA = resolve('cycle-a.ts');
  const cycleB = resolve('cycle-b.ts');
  const branchX = resolve('branch-x.ts');
  const branchY = resolve('branch-y.ts');
  const root = resolve('root.ts');

  const appleExport = { ...baseExport, identifier: 'apple', binding: 'apple' };
  const berryExport = { ...baseExport, identifier: 'berry', binding: 'berry' };
  const graph: ModuleGraph = new Map([
    [leafApple, { ...baseFileNode, exports: new Map([['apple', appleExport]]), importedBy: starMaps(cycleA) }],
    [leafBerry, { ...baseFileNode, exports: new Map([['berry', berryExport]]), importedBy: starMaps(cycleB) }],
    [cycleA, starNode(cycleA, [cycleB, leafApple], [cycleB, branchX])],
    [cycleB, starNode(cycleB, [cycleA, leafBerry], [cycleA, branchY])],
    [branchX, starNode(branchX, [cycleA], [root])],
    [branchY, starNode(branchY, [cycleB], [root])],
    [root, starNode(root, [branchX, branchY], [])],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const first = explorer.getContention(root);
  const second = explorer.getContention(root);

  assert.deepEqual([...first.keys()].sort(), ['apple', 'berry']);
  assert.deepEqual(first.get('apple')?.sites, [
    {
      kind: 'converged',
      filePath: root,
      identifier: 'apple',
      origins: [{ filePath: leafApple, identifier: 'apple', line: 1, col: 0 }],
      sources: [branchX, branchY],
    },
  ]);
  assert.deepEqual(second.get('apple'), first.get('apple'));
  assert.deepEqual(second.get('berry'), first.get('berry'));
});

test('cuts an asymmetric re-export cycle the same way whichever file is described first', () => {
  const orchard = resolve('orchard.ts');
  const ringA = resolve('ring-a.ts');
  const ringB = resolve('ring-b.ts');
  const ringC = resolve('ring-c.ts');

  const graph: ModuleGraph = new Map([
    [orchard, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]), importedBy: starMaps(ringC) }],
    [ringA, starNode(ringA, [ringB, ringC], [ringB])],
    [ringB, starNode(ringB, [ringA], [ringA, ringC])],
    [ringC, starNode(ringC, [orchard, ringB], [ringA])],
  ]);

  const explorer = createGraphExplorer(graph, new Set());

  const describeFirst = (filePath: string) => {
    explorer.invalidateCache();
    explorer.getContention(filePath);
    return [...explorer.getContention(ringC)];
  };

  assert.deepEqual(describeFirst(ringC), []);
  assert.deepEqual(describeFirst(ringA), []);
  assert.deepEqual(describeFirst(ringB), []);
});

test('keeps package specifiers out of the legacy conflict summary', () => {
  const homegrown = resolve('homegrown.ts');
  const imported = resolve('imported.ts');
  const barrel = resolve('barrel.ts');

  const graph: ModuleGraph = new Map([
    [homegrown, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]), importedBy: starMaps(barrel) }],
    [
      imported,
      {
        ...baseFileNode,
        exports: new Map([['fruit', { ...fruitExport, isReExport: true, isBindingReExport: true }]]),
        imports: {
          ...baseFileNode.imports,
          external: new Set([
            {
              ...getBaseImport(resolve('node_modules/produce-pkg/index.js')),
              specifier: 'produce-pkg',
              identifier: 'fruit',
              modifiers: IMPORT_FLAGS.RE_EXPORT,
            },
          ]),
        },
        importedBy: starMaps(barrel),
      },
    ],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [imported, starMaps(barrel)],
            [homegrown, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const fruit = explorer.getContention(barrel).get('fruit');

  assert.ok(fruit);
  assert.equal(fruit.sites[0].kind, 'ambiguous');
  assert.deepEqual(fruit.branching, []);
  assert.deepEqual(fruit.conflict, [homegrown]);
  assert.deepEqual(fruit.sites[0].origins, [
    { filePath: homegrown, identifier: 'fruit', line: 1, col: 0 },
    { filePath: 'produce-pkg', identifier: 'fruit' },
  ]);
});

test('keeps the described name first when the walk returns to it under an alias', () => {
  const apple = resolve('apple.ts');
  const left = resolve('left.ts');
  const right = resolve('right.ts');
  const mixer = resolve('mixer.ts');
  const pearBlend = resolve('pear-blend.ts');
  const barrel = resolve('barrel.ts');

  const graph: ModuleGraph = new Map([
    [apple, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]), importedBy: starMaps(left, right) }],
    [
      left,
      {
        ...baseFileNode,
        imports: { ...baseFileNode.imports, internal: new Map([[apple, starMaps(left)]]) },
        importedBy: starMaps(barrel),
      },
    ],
    [
      right,
      {
        ...baseFileNode,
        imports: { ...baseFileNode.imports, internal: new Map([[apple, starMaps(right)]]) },
        importedBy: starMaps(barrel),
      },
    ],
    [
      mixer,
      {
        ...baseFileNode,
        exports: new Map([
          [
            'blend',
            { ...baseExport, identifier: 'blend', binding: 'fruit', isReExport: true, isBindingReExport: true },
          ],
        ]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [barrel, { ...baseImportMaps, reExportAs: new Map([['fruit', new Map([['blend', new Set([mixer])]])]]) }],
          ]),
        },
        importedBy: starMaps(barrel),
      },
    ],
    [
      pearBlend,
      {
        ...baseFileNode,
        exports: new Map([['blend', { ...baseExport, identifier: 'blend', binding: 'blend' }]]),
        importedBy: starMaps(barrel),
      },
    ],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [left, starMaps(barrel)],
            [right, starMaps(barrel)],
            [mixer, starMaps(barrel)],
            [pearBlend, starMaps(barrel)],
          ]),
        },
        importedBy: { ...baseImportMaps, reExportAs: new Map([['fruit', new Map([['blend', new Set([mixer])]])]]) },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const fruit = explorer.getContention(barrel).get('fruit');

  assert.ok(fruit);
  assert.equal(fruit.sites[0].kind, 'converged');
  assert.deepEqual(
    fruit.sites.map(site => [site.filePath, site.identifier, site.kind]),
    [
      [barrel, 'fruit', 'converged'],
      [barrel, 'blend', 'ambiguous'],
    ]
  );
});

test('counts a re-export from a builtin module as a competing binding', () => {
  const builtinReExport = resolve('builtin-re-export.ts');
  const localRead = resolve('local-read.ts');
  const barrel = resolve('barrel.ts');

  const readFileExport = { ...baseExport, identifier: 'readFile', binding: 'readFile' };

  const graph: ModuleGraph = new Map([
    [
      builtinReExport,
      {
        ...baseFileNode,
        exports: new Map([['readFile', { ...readFileExport, isReExport: true, isBindingReExport: true }]]),
        imports: {
          ...baseFileNode.imports,
          imports: new Set([
            {
              ...getBaseImport(undefined),
              specifier: 'node:fs',
              identifier: 'readFile',
              modifiers: IMPORT_FLAGS.RE_EXPORT,
            },
          ]),
        },
        importedBy: starMaps(barrel),
      },
    ],
    [localRead, { ...baseFileNode, exports: new Map([['readFile', readFileExport]]), importedBy: starMaps(barrel) }],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [builtinReExport, starMaps(barrel)],
            [localRead, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const readFile = explorer.getContention(barrel).get('readFile');

  assert.ok(readFile);
  assert.equal(readFile.sites[0].kind, 'ambiguous');
  assert.deepEqual(readFile.sites[0].origins, [
    { filePath: localRead, identifier: 'readFile', line: 1, col: 0 },
    { filePath: 'node:fs', identifier: 'readFile' },
  ]);
  assert.deepEqual(readFile.conflict, [localRead]);
});

test('falls back to the site path when every origin is a package specifier', () => {
  const importedLeft = resolve('imported-left.ts');
  const importedRight = resolve('imported-right.ts');
  const barrel = resolve('barrel.ts');

  const reExport = (specifier: string) => ({
    ...baseFileNode,
    exports: new Map([['fruit', { ...fruitExport, isReExport: true, isBindingReExport: true }]]),
    imports: {
      ...baseFileNode.imports,
      external: new Set([
        {
          ...getBaseImport(resolve(`node_modules/${specifier}/index.js`)),
          specifier,
          identifier: 'fruit',
          modifiers: IMPORT_FLAGS.RE_EXPORT,
        },
      ]),
    },
    importedBy: starMaps(barrel),
  });

  const graph: ModuleGraph = new Map([
    [importedLeft, reExport('left-pkg')],
    [importedRight, reExport('right-pkg')],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [importedLeft, starMaps(barrel)],
            [importedRight, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const fruit = explorer.getContention(barrel).get('fruit');

  assert.ok(fruit);
  assert.equal(fruit.sites[0].kind, 'ambiguous');
  assert.deepEqual(fruit.sites[0].origins, [
    { filePath: 'left-pkg', identifier: 'fruit' },
    { filePath: 'right-pkg', identifier: 'fruit' },
  ]);
  assert.deepEqual(fruit.branching, []);
  assert.deepEqual(fruit.conflict, [barrel]);
});

test('reports ambiguous over shadowed when both hold at one site', () => {
  const apple = resolve('apple.ts');
  const pear = resolve('pear.ts');
  const ambiguousPass = resolve('ambiguous-pass.ts');
  const hidden = resolve('hidden.ts');
  const barrel = resolve('barrel.ts');

  const graph: ModuleGraph = new Map([
    [apple, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]), importedBy: starMaps(ambiguousPass) }],
    [pear, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]), importedBy: starMaps(ambiguousPass) }],
    [
      ambiguousPass,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [apple, starMaps(ambiguousPass)],
            [pear, starMaps(ambiguousPass)],
          ]),
        },
        importedBy: { ...baseImportMaps, reExport: new Map([['fruit', new Set([barrel])]]) },
      },
    ],
    [hidden, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]), importedBy: starMaps(barrel) }],
    [
      barrel,
      {
        ...baseFileNode,
        exports: new Map([['fruit', { ...fruitExport, isReExport: true, isBindingReExport: true }]]),
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [ambiguousPass, { ...baseImportMaps, reExport: new Map([['fruit', new Set([barrel])]]) }],
            [hidden, starMaps(barrel)],
          ]),
        },
      },
    ],
  ]);

  const explorer = createGraphExplorer(graph, new Set());
  const fruit = explorer.getContention(barrel).get('fruit');

  assert.ok(fruit);
  assert.equal(fruit.sites[0].kind, 'ambiguous');
  assert.equal(fruit.sites[0].winner, undefined);
  assert.deepEqual(fruit.sites[0].origins, [
    { filePath: apple, identifier: 'fruit', line: 1, col: 0 },
    { filePath: pear, identifier: 'fruit', line: 1, col: 0 },
  ]);
});
