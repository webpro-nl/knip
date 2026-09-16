import assert from 'node:assert/strict';
import test from 'node:test';
import { IMPORT_FLAGS } from '../../src/constants.ts';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import { getAmbiguousStarExport } from '../../src/graph-explorer/operations/get-ambiguous-star-export.ts';
import { resolveExportOrigins } from '../../src/graph-explorer/operations/resolve-export-origins.ts';
import type { FileNode, ModuleGraph } from '../../src/types/module-graph.ts';
import { baseExport, baseFileNode, baseImportMaps, getBaseImport } from '../helpers/baseNodeObjects.ts';
import { resolve } from '../helpers/resolve.ts';

test('Explicit export wins over a shadowed star export', () => {
  const winner = resolve('winner.ts');
  const shadowed = resolve('shadowed.ts');
  const barrel = resolve('barrel.ts');
  const fruitExport = { ...baseExport, identifier: 'fruit', binding: 'fruit' };
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
            [shadowed, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
          ]),
        },
      },
    ],
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  assert.equal(getAmbiguousStarExport(explorer.resolveExportOrigins(barrel, 'fruit'), 'fruit'), undefined);
});

test('External re-export and local definition behind two stars are ambiguous', () => {
  const imported = resolve('imported.ts');
  const homegrown = resolve('homegrown.ts');
  const barrel = resolve('barrel.ts');
  const fruitExport = { ...baseExport, identifier: 'fruit', binding: 'fruit' };
  const externalReExport = {
    ...getBaseImport(resolve('node_modules/produce-pkg/index.js')),
    specifier: 'produce-pkg',
    identifier: 'fruit',
    modifiers: IMPORT_FLAGS.RE_EXPORT,
  };
  const graph: ModuleGraph = new Map([
    [
      imported,
      {
        ...baseFileNode,
        exports: new Map([['fruit', { ...fruitExport, isReExport: true, isBindingReExport: true }]]),
        imports: { ...baseFileNode.imports, external: new Set([externalReExport]) },
      },
    ],
    [homegrown, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [imported, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
            [homegrown, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
          ]),
        },
      },
    ],
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  assert.deepEqual(getAmbiguousStarExport(explorer.resolveExportOrigins(barrel, 'fruit'), 'fruit'), {
    origins: [
      { filePath: 'produce-pkg', identifier: 'fruit' },
      { filePath: homegrown, identifier: 'fruit' },
    ],
  });
});

test('External re-exports of one package binding converge into one origin', () => {
  const imported = resolve('imported.ts');
  const relayed = resolve('relayed.ts');
  const barrel = resolve('barrel.ts');
  const externalReExport = {
    ...getBaseImport(resolve('node_modules/produce-pkg/index.js')),
    specifier: 'produce-pkg',
    identifier: 'fruit',
    modifiers: IMPORT_FLAGS.RE_EXPORT,
  };
  const graph: ModuleGraph = new Map([
    [
      imported,
      {
        ...baseFileNode,
        exports: new Map([
          [
            'fruit',
            { ...baseExport, identifier: 'fruit', binding: 'fruit', isReExport: true, isBindingReExport: true },
          ],
        ]),
        imports: { ...baseFileNode.imports, external: new Set([externalReExport]) },
      },
    ],
    [
      relayed,
      {
        ...baseFileNode,
        exports: new Map([['fruit', { ...baseExport, identifier: 'fruit', binding: 'fruit' }]]),
        imports: { ...baseFileNode.imports, external: new Set([externalReExport]) },
      },
    ],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [imported, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
            [relayed, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
          ]),
        },
      },
    ],
  ]);

  assert.deepEqual(resolveExportOrigins(graph, barrel, 'fruit'), {
    origins: [{ filePath: 'produce-pkg', identifier: 'fruit' }],
    hasExplicitExport: false,
  });
});

test('A type-only external re-export does not displace a same-named local value', () => {
  const mixed = resolve('mixed.ts');
  const other = resolve('other.ts');
  const barrel = resolve('barrel.ts');
  const typeReExport = {
    ...getBaseImport(resolve('node_modules/produce-pkg/index.js')),
    specifier: 'produce-pkg',
    identifier: 'Fruit',
    isTypeOnly: true,
    modifiers: IMPORT_FLAGS.RE_EXPORT | IMPORT_FLAGS.TYPE_ONLY,
  };
  const graph: ModuleGraph = new Map([
    [
      mixed,
      {
        ...baseFileNode,
        exports: new Map([['Fruit', { ...baseExport, identifier: 'Fruit', binding: 'Fruit' }]]),
        imports: { ...baseFileNode.imports, external: new Set([typeReExport]) },
      },
    ],
    [
      other,
      { ...baseFileNode, exports: new Map([['Fruit', { ...baseExport, identifier: 'Fruit', binding: 'Fruit' }]]) },
    ],
    [
      barrel,
      {
        ...baseFileNode,
        imports: {
          ...baseFileNode.imports,
          internal: new Map([
            [mixed, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
            [other, { ...baseImportMaps, reExport: new Map([['*', new Set([barrel])]]) }],
          ]),
        },
      },
    ],
  ]);
  const explorer = createGraphExplorer(graph, new Set());

  assert.deepEqual(getAmbiguousStarExport(explorer.resolveExportOrigins(barrel, 'Fruit'), 'Fruit'), {
    origins: [
      { filePath: mixed, identifier: 'Fruit' },
      { filePath: other, identifier: 'Fruit' },
    ],
  });
});

test('terminates and returns the same origins from either entry of a re-export cycle', () => {
  const cycleA = resolve('cycle-a.ts');
  const cycleB = resolve('cycle-b.ts');
  const cycleC = resolve('cycle-c.ts');
  const leafA = resolve('leaf-a.ts');
  const leafB = resolve('leaf-b.ts');
  const leafC = resolve('leaf-c.ts');
  const fruitExport = { ...baseExport, identifier: 'fruit', binding: 'fruit' };

  const starMaps = (consumer: string) => ({ ...baseImportMaps, reExport: new Map([['*', new Set([consumer])]]) });
  const member = (cycle: string, next: string, leaf: string): [string, FileNode] => [
    cycle,
    {
      ...baseFileNode,
      imports: {
        ...baseFileNode.imports,
        internal: new Map([
          [next, starMaps(cycle)],
          [leaf, starMaps(cycle)],
        ]),
      },
    },
  ];
  const createGraph = (): ModuleGraph =>
    new Map([
      [leafA, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
      [leafB, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
      [leafC, { ...baseFileNode, exports: new Map([['fruit', fruitExport]]) }],
      member(cycleA, cycleB, leafA),
      member(cycleB, cycleC, leafB),
      member(cycleC, cycleA, leafC),
    ]);

  const expected = [leafA, leafB, leafC].sort();
  const originPaths = (graph: ModuleGraph, filePath: string) => {
    const resolution = resolveExportOrigins(graph, filePath, 'fruit');
    const paths = [];
    for (const origin of resolution.origins) paths.push(origin.filePath);
    return paths.sort();
  };

  const forward = createGraph();
  assert.deepEqual(originPaths(forward, cycleA), expected);
  assert.deepEqual(originPaths(forward, cycleB), expected);
  assert.deepEqual(originPaths(forward, cycleC), expected);

  const reverse = createGraph();
  assert.deepEqual(originPaths(reverse, cycleC), expected);
  assert.deepEqual(originPaths(reverse, cycleB), expected);
  assert.deepEqual(originPaths(reverse, cycleA), expected);
});

test('resolves a binding re-export inside a re-export cycle from either entry', () => {
  const barrel = resolve('cycle-barrel.ts');
  const relay = resolve('cycle-relay.ts');
  const orchard = resolve('orchard.ts');
  const market = resolve('market.ts');

  const starMaps = (consumer: string) => ({ ...baseImportMaps, reExport: new Map([['*', new Set([consumer])]]) });
  const createGraph = (): ModuleGraph =>
    new Map([
      [
        orchard,
        { ...baseFileNode, exports: new Map([['apple', { ...baseExport, identifier: 'apple', binding: 'apple' }]]) },
      ],
      [
        market,
        { ...baseFileNode, exports: new Map([['fruit', { ...baseExport, identifier: 'fruit', binding: 'fruit' }]]) },
      ],
      [
        relay,
        {
          ...baseFileNode,
          exports: new Map([
            [
              'fruit',
              { ...baseExport, identifier: 'fruit', binding: 'apple', isReExport: true, isBindingReExport: true },
            ],
          ]),
          imports: {
            ...baseFileNode.imports,
            internal: new Map([
              [barrel, { ...baseImportMaps, reExportAs: new Map([['apple', new Map([['fruit', new Set([relay])]])]]) }],
            ]),
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
              [orchard, starMaps(barrel)],
              [market, starMaps(barrel)],
            ]),
          },
        },
      ],
    ]);

  const originKeys = (graph: ModuleGraph, filePath: string) => {
    const keys = [];
    for (const origin of resolveExportOrigins(graph, filePath, 'fruit').origins) {
      keys.push(`${origin.filePath}:${origin.identifier}`);
    }
    return keys.sort();
  };

  const fromBarrel = [`${market}:fruit`, `${orchard}:apple`].sort();
  const fromRelay = [`${orchard}:apple`];

  const forward = createGraph();
  assert.deepEqual(originKeys(forward, barrel), fromBarrel);
  assert.deepEqual(originKeys(forward, relay), fromRelay);

  const reverse = createGraph();
  assert.deepEqual(originKeys(reverse, relay), fromRelay);
  assert.deepEqual(originKeys(reverse, barrel), fromBarrel);
});
