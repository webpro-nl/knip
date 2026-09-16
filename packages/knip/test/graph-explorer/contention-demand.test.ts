import assert from 'node:assert/strict';
import test from 'node:test';
import { getCachedExportTable } from '../../src/graph-explorer/cache.ts';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import type { Export, ModuleGraph } from '../../src/types/module-graph.ts';
import { baseExport, baseFileNode, baseImportMaps } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

interface ModuleSpec {
  path: string;
  local?: Export[];
  stars?: string[];
  named?: Array<[string, string]>;
}

const localExport = (identifier: string): Export => ({ ...baseExport, identifier, binding: identifier });

const createGraph = (modules: ModuleSpec[]): ModuleGraph => {
  const graph: ModuleGraph = new Map();
  for (const module of modules) {
    graph.set(module.path, {
      ...baseFileNode,
      exports: new Map(module.local?.map(value => [value.identifier, value])),
      imports: { ...baseFileNode.imports, internal: new Map() },
      importedBy: { ...baseImportMaps, reExport: new Map() },
    });
  }
  for (const module of modules) {
    const node = graph.get(module.path);
    assert.ok(node);
    const addEdge = (source: string, identifier: string) => {
      let imports = node.imports.internal.get(source);
      if (!imports) {
        imports = { ...baseImportMaps, reExport: new Map() };
        node.imports.internal.set(source, imports);
      }
      imports.reExport.set(identifier, new Set([module.path]));
      const importedBy = graph.get(source)?.importedBy;
      assert.ok(importedBy);
      let consumers = importedBy.reExport.get(identifier);
      if (!consumers) importedBy.reExport.set(identifier, (consumers = new Set()));
      consumers.add(module.path);
    };
    for (const source of module.stars ?? []) addEdge(source, '*');
    for (const [identifier, source] of module.named ?? []) {
      node.exports.set(identifier, {
        ...localExport(identifier),
        isReExport: true,
        isBindingReExport: true,
      });
      addEdge(source, identifier);
    }
  }
  return graph;
};

test('keeps converging paths when another name creates a re-export cycle', () => {
  const origin = resolve('orchard.ts');
  const barrel = resolve('barrel.ts');
  const bridge = resolve('bridge.ts');
  const graph = createGraph([
    { path: origin, local: [localExport('fruit')] },
    { path: barrel, local: [localExport('other')], stars: [origin, bridge] },
    {
      path: bridge,
      named: [
        ['fruit', origin],
        ['other', barrel],
      ],
    },
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  for (const first of [origin, barrel, bridge]) {
    explorer.invalidateCache();
    explorer.getContention(first);
    const details = explorer.getContention(barrel).get('fruit');
    assert.ok(details);
    assert.deepEqual(details.sites, [
      {
        kind: 'converged',
        filePath: barrel,
        identifier: 'fruit',
        origins: [{ filePath: origin, identifier: 'fruit', line: 1, col: 0 }],
        sources: [origin, bridge],
      },
    ]);
    assert.equal(explorer.getContention(barrel).has('other'), false);
  }
});

test('keeps independent paths to one binding inside a same-name cycle', () => {
  const origin = resolve('orchard.ts');
  const ringA = resolve('ring-a.ts');
  const ringB = resolve('ring-b.ts');
  const graph = createGraph([
    { path: origin, local: [localExport('fruit')] },
    { path: ringA, stars: [origin, ringB] },
    { path: ringB, stars: [origin, ringA] },
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  for (const first of [origin, ringA, ringB]) {
    explorer.invalidateCache();
    explorer.getContention(first);
    const details = explorer.getContention(ringA).get('fruit');
    assert.ok(details);
    assert.deepEqual(
      details.sites.map(site => [site.filePath, site.kind, site.sources]),
      [
        [ringA, 'converged', [origin, ringB]],
        [ringB, 'converged', [origin, ringA]],
      ]
    );
  }
});

test('does not count a cycle that only returns a binding to its own source', () => {
  const origin = resolve('orchard.ts');
  const ringA = resolve('ring-a.ts');
  const ringB = resolve('ring-b.ts');
  const graph = createGraph([
    { path: origin, local: [localExport('fruit')] },
    { path: ringA, stars: [origin, ringB] },
    { path: ringB, stars: [ringA] },
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  for (const first of [origin, ringA, ringB]) {
    explorer.invalidateCache();
    explorer.getContention(first);
    for (const path of [origin, ringA, ringB]) assert.deepEqual([...explorer.getContention(path)], []);
  }
});

test('resolves a local binding without scanning an unrelated deep star chain', () => {
  const paths = Array.from({ length: 2500 }, (_, index) => resolve(`chain-${index}.ts`));
  const graph = createGraph(
    paths.map((path, index) => ({
      path,
      local: index === 0 ? [localExport('fruit')] : [],
      stars: index + 1 < paths.length ? [paths[index + 1]] : [],
    }))
  );
  let reads = 0;
  let scans = 0;
  const countedGraph = new Proxy(graph, {
    get(target, property) {
      if (property === 'get') {
        return (path: string) => {
          reads++;
          return target.get(path);
        };
      }
      if (property === Symbol.iterator) {
        return () => {
          scans++;
          return target[Symbol.iterator]();
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const explorer = createGraphExplorer(countedGraph, new Set());

  assert.deepEqual(explorer.resolveExportOrigins(paths[0], 'fruit'), {
    origins: [{ filePath: paths[0], identifier: 'fruit' }],
    hasExplicitExport: true,
  });
  assert.equal(scans, 0);
  assert.ok(reads <= 4, `local resolution read ${reads} graph nodes`);
});

test('does not resolve unrelated exports while following a name to its contention site', () => {
  const origin = resolve('orchard.ts');
  const left = resolve('left.ts');
  const right = resolve('right.ts');
  const barrel = resolve('barrel.ts');
  let unrelatedReads = 0;
  const unrelated = Array.from({ length: 200 }, (_, index) => ({
    ...baseExport,
    identifier: `unrelated${index}`,
    get binding() {
      unrelatedReads++;
      return `unrelated${index}`;
    },
  }));
  const graph = createGraph([
    { path: origin, local: [localExport('fruit')] },
    { path: left, local: unrelated, stars: [origin] },
    { path: right, stars: [origin] },
    { path: barrel, stars: [left, right] },
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  const details = explorer.getContention(origin).get('fruit');
  assert.ok(details);
  assert.deepEqual(details.sites, [
    {
      kind: 'converged',
      filePath: barrel,
      identifier: 'fruit',
      origins: [{ filePath: origin, identifier: 'fruit', line: 1, col: 0 }],
      sources: [left, right],
    },
  ]);
  assert.equal(unrelatedReads, 0);
  assert.ok((getCachedExportTable(graph, left)?.entries.size ?? 0) <= 1);
  assert.ok((getCachedExportTable(graph, barrel)?.entries.size ?? 0) <= 1);
});

test('keeps full-barrel resolution sparse across disjoint export names', () => {
  const sources = Array.from({ length: 12 }, (_, index) => resolve(`orchard-${index}.ts`));
  const bridge = resolve('bridge.ts');
  const barrel = resolve('barrel.ts');
  const graph = createGraph([
    ...sources.map((path, sourceIndex) => ({
      path,
      local: Array.from({ length: 16 }, (_, index) => localExport(`fruit${sourceIndex}_${index}`)),
    })),
    { path: bridge, named: [['fruit11_15', sources[11]]] },
    { path: barrel, stars: [...sources, bridge] },
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  const contention = explorer.getContention(barrel);
  assert.deepEqual([...contention.keys()], ['fruit11_15']);
  assert.equal(contention.get('fruit11_15')?.sites[0].kind, 'converged');
  assert.deepEqual(explorer.resolveExportOrigins(barrel, 'fruit11_15'), {
    origins: [{ filePath: sources[11], identifier: 'fruit11_15' }],
    hasExplicitExport: false,
  });
  let entries = 0;
  for (const path of graph.keys()) entries += getCachedExportTable(graph, path)?.entries.size ?? 0;
  assert.ok(entries <= 400, `resolving 192 disjoint names retained ${entries} entries`);
});

test('keeps source bindings unchanged when a consumer adds another origin', () => {
  const apples = resolve('apples.ts');
  const pears = resolve('pears.ts');
  const bridge = resolve('bridge.ts');
  const barrel = resolve('barrel.ts');
  const graph = createGraph([
    { path: apples, local: [localExport('fruit')] },
    { path: pears, local: [localExport('fruit')] },
    { path: bridge, named: [['fruit', apples]] },
    { path: barrel, stars: [bridge, pears] },
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  assert.deepEqual(explorer.resolveExportOrigins(bridge, 'fruit'), {
    origins: [{ filePath: apples, identifier: 'fruit' }],
    hasExplicitExport: true,
  });
  assert.deepEqual(
    explorer
      .resolveExportOrigins(barrel, 'fruit')
      .origins.map(origin => origin.filePath)
      .sort(),
    [apples, pears]
  );
  for (const path of [apples, bridge]) {
    assert.deepEqual(explorer.resolveExportOrigins(path, 'fruit'), {
      origins: [{ filePath: apples, identifier: 'fruit' }],
      hasExplicitExport: true,
    });
  }
});

test('resolves the replacement source binding after invalidating the graph cache', () => {
  const origin = resolve('orchard.ts');
  const barrel = resolve('barrel.ts');
  const graph = createGraph([
    { path: origin, local: [{ ...localExport('fruit'), binding: 'apple' }] },
    { path: barrel, stars: [origin] },
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  assert.deepEqual(explorer.resolveExportOrigins(barrel, 'fruit'), {
    origins: [{ filePath: origin, identifier: 'apple' }],
    hasExplicitExport: false,
  });

  graph.set(origin, {
    ...baseFileNode,
    exports: new Map([['fruit', { ...localExport('fruit'), binding: 'pear' }]]),
  });
  explorer.invalidateCache();

  assert.deepEqual(explorer.resolveExportOrigins(barrel, 'fruit'), {
    origins: [{ filePath: origin, identifier: 'pear' }],
    hasExplicitExport: false,
  });
});
