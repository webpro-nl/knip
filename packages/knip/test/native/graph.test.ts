import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import { hasStrictlyNsReferences } from '../../src/graph-explorer/operations/has-strictly-ns-references.ts';
import { isEnumerated } from '../../src/graph-explorer/operations/is-enumerated.ts';
import { isReferenced } from '../../src/graph-explorer/operations/is-referenced.ts';
import { createNativeGraphUsage, type GraphUsage } from '../../src/native-graph.ts';
import type { IdToFileMap, IdToNsToFileMap, ImportMaps, ModuleGraph } from '../../src/types/module-graph.ts';
import { createFileNode } from '../../src/util/module-graph.ts';
import { createImports } from '../../src/util/create-imports.ts';

const sources = (...entries: [string, string[]][]): IdToFileMap => {
  const map: IdToFileMap = new Map();
  for (const [id, paths] of entries) map.set(id, new Set(paths));
  return map;
};

const aliases = (...entries: [string, [string, string[]][]][]): IdToNsToFileMap => {
  const map: IdToNsToFileMap = new Map();
  for (const [id, values] of entries) map.set(id, sources(...values));
  return map;
};

const node = (imports?: Partial<ImportMaps>, skipExports = false, hasDefaultExport = false) => {
  const file = createFileNode();
  file.importedBy = imports && { ...createImports(), ...imports };
  file.skipExports = skipExports;
  if (hasDefaultExport) {
    file.exports.set('default', {
      identifier: 'default',
      binding: 'default',
      type: 'unknown',
      pos: 0,
      line: 1,
      col: 0,
      members: [],
      jsDocTags: new Set(),
      hasRefsInFile: false,
      isRegistered: false,
      referencedIn: undefined,
      fixes: [],
      isReExport: false,
      isBindingReExport: false,
    });
  }
  return file;
};

const ordered = ([referenced, entryPath, ids]: ReturnType<GraphUsage['isReferenced']>) => [
  referenced,
  entryPath,
  ids && [...ids],
];

const compare = (graph: ModuleGraph, entries: Set<string>, queries: [string, string][], label = '') => {
  const native = createNativeGraphUsage(graph, entries);
  for (let round = 0; round < 2; round++) {
    for (const [path, id] of queries) {
      const context = `${label} ${JSON.stringify([path, id])}`;
      for (const traverseEntries of [false, true]) {
        for (const treatStarAtEntryAsReferenced of [undefined, false, true]) {
          const options = { traverseEntries, treatStarAtEntryAsReferenced };
          assert.deepEqual(
            ordered(native.isReferenced(path, id, options)),
            ordered(isReferenced(graph, entries, path, id, options)),
            `${context} ${JSON.stringify(options)}`
          );
        }
      }
      assert.deepEqual(
        native.hasStrictlyNsReferences(path, id),
        hasStrictlyNsReferences(graph, path, graph.get(path)?.importedBy, id),
        `${context} namespaces`
      );
      assert.equal(
        native.isEnumerated(path, id),
        isEnumerated(graph, path, graph.get(path)?.importedBy, id),
        `${context} enumeration`
      );
    }
  }
  return native;
};

test('Native usage retains entry metadata after a direct reference and stops at the first entry', () => {
  const graph: ModuleGraph = new Map([
    ['source', node({ import: sources(['value', []]), reExport: sources(['value', ['barrel', 'second-entry']]) })],
    ['barrel', node({ reExport: sources(['value', ['first-entry']]) })],
  ]);
  const native = compare(graph, new Set(['first-entry', 'second-entry']), [['source', 'value']]);
  assert.deepEqual(ordered(native.isReferenced('source', 'value', { traverseEntries: false })), [
    true,
    'first-entry',
    ['value'],
  ]);
  assert.deepEqual(ordered(native.isReferenced('source', 'value', { traverseEntries: true })), [
    true,
    undefined,
    undefined,
  ]);
});

test('Native usage records ordered entry identifiers before the seen check, including missing nodes', () => {
  const graph: ModuleGraph = new Map([
    [
      'source',
      node({
        reExportAs: aliases([
          'value',
          [
            ['NS.first', ['entry']],
            ['NS.second', ['entry']],
            ['NS.first', ['entry']],
          ],
        ]),
        reExportNs: sources(['Other', ['entry', 'other-entry']]),
      }),
    ],
  ]);
  const native = compare(graph, new Set(['entry', 'other-entry']), [['source', 'value']]);
  assert.deepEqual(ordered(native.isReferenced('source', 'value', { traverseEntries: false })), [
    false,
    'entry',
    ['NS.first', 'NS.second', 'Other.value'],
  ]);
});

test('Native usage preserves empty named re-export keys, which suppress only the reference star fallback', () => {
  const graph: ModuleGraph = new Map([
    ['source', node({ reExport: sources(['value', []], ['*', ['entry']]) })],
    ['entry', node({ enumerated: new Set(['value']), importNs: sources(['NS', []]), refs: new Set(['NS']) }, true)],
  ]);
  const native = compare(graph, new Set(['entry']), [['source', 'value']]);
  assert.deepEqual(ordered(native.isReferenced('source', 'value', { traverseEntries: true })), [
    false,
    undefined,
    undefined,
  ]);
  assert.equal(native.isEnumerated('source', 'value'), true);
  assert.deepEqual(native.hasStrictlyNsReferences('source', 'value'), [true, 'NS']);
});

test('Native usage separates opaque imports and loader defaults, including empty keys and namespace-only refs', () => {
  for (const imported of ['__opaque', '__loader-default']) {
    for (const hasDefault of [false, true]) {
      for (const refs of [[], ['NS'], ['NS.member']]) {
        const graph: ModuleGraph = new Map([
          [
            'source',
            node(
              { import: sources([imported, []]), importNs: sources(['NS', []]), refs: new Set(refs) },
              false,
              hasDefault
            ),
          ],
        ]);
        compare(
          graph,
          new Set(),
          [
            ['source', 'value'],
            ['source', 'default'],
            ['source', 'default.member'],
          ],
          `${imported} ${hasDefault} ${refs}`
        );
      }
    }
  }
});

test('Native usage keeps namespace tuple lengths, empty namespaces and iteration-selected namespaces', () => {
  for (const names of [[], [''], ['First', 'Last'], ['Last', 'First'], ['First', '']]) {
    for (const refs of [names, [...names, 'First.member'], []]) {
      const importNs: IdToFileMap = new Map();
      for (const name of names) importNs.set(name, new Set());
      const graph: ModuleGraph = new Map([['source', node({ importNs, refs: new Set(refs) })]]);
      compare(graph, new Set(), [['source', 'value']]);
    }
  }
  const native = createNativeGraphUsage(new Map([['source', node({ importNs: sources(['', []]) })]]), new Set());
  assert.deepEqual(native.hasStrictlyNsReferences('source', 'value'), [false, '']);
  assert.deepEqual(native.hasStrictlyNsReferences('missing', 'value'), [false]);
});

test('Native namespace traversal follows imports and namespaces while enumeration follows only named, star and alias re-exports', () => {
  const graph: ModuleGraph = new Map([
    ['direct', node({ import: sources(['value', ['consumer']]) })],
    ['alias', node({ importAs: aliases(['value', [['Renamed', ['consumer']]]]) })],
    ['namespace', node({ reExportNs: sources(['NS', ['consumer']]) })],
    ['named', node({ reExport: sources(['value', ['consumer']]) })],
    ['star', node({ reExport: sources(['*', ['consumer']]) })],
    ['renamed', node({ reExportAs: aliases(['value', [['Renamed', ['consumer']]]]) })],
    [
      'consumer',
      node({
        enumerated: new Set(['value', 'Renamed', 'NS.value']),
        importNs: sources(['Used', []]),
        refs: new Set(['Used']),
      }),
    ],
  ]);
  const queries: [string, string][] = [];
  for (const path of graph.keys()) queries.push([path, 'value']);
  const native = compare(graph, new Set(), queries);
  for (const path of ['direct', 'alias', 'namespace']) {
    assert.equal(native.isEnumerated(path, 'value'), false);
    assert.deepEqual(native.hasStrictlyNsReferences(path, 'value'), [true, 'Used']);
  }
  for (const path of ['named', 'star', 'renamed']) assert.equal(native.isEnumerated(path, 'value'), true);
});

test('Native usage shares seen state across cycles, aliases and member paths', () => {
  const graph: ModuleGraph = new Map([
    [
      'source',
      node({
        reExportAs: aliases([
          'value',
          [
            ['NS.first', ['cycle']],
            ['NS.second', ['cycle']],
          ],
        ]),
      }),
    ],
    [
      'cycle',
      node({
        refs: new Set(['NS.second']),
        import: sources(['NS', []]),
        reExport: sources(['*', ['source']]),
        enumerated: new Set(['NS.second']),
      }),
    ],
  ]);
  const native = compare(graph, new Set(), [
    ['source', 'value'],
    ['cycle', 'NS.first'],
    ['cycle', 'NS.second'],
  ]);
  assert.equal(native.isReferenced('source', 'value', { traverseEntries: true })[0], false);
  assert.equal(native.isEnumerated('source', 'value'), false);
});

test('Native reference cycle keys retain literal colon collisions', () => {
  const graph: ModuleGraph = new Map([
    [
      'root',
      node({
        reExportAs: aliases([
          'value',
          [
            ['b:c', ['a']],
            ['c', ['a:b']],
          ],
        ]),
      }),
    ],
    ['a', node({})],
    ['a:b', node({ import: sources(['c', []]) })],
  ]);
  const native = compare(graph, new Set(), [['root', 'value']]);
  assert.equal(native.isReferenced('root', 'value', { traverseEntries: true })[0], false);
});

test('Native usage preserves star arrival, entry stopping and bookkeeping for empty paths and identifiers', () => {
  const graph: ModuleGraph = new Map([
    [
      'source',
      node({
        importNs: sources(['NS', []]),
        reExportNs: sources(['NS', ['entry']]),
        reExportAs: aliases(['NS', [['Alias', ['entry']]]]),
        reExport: sources(['*', ['']]),
      }),
    ],
    ['', node({ reExportNs: sources(['Empty', ['entry']]) })],
    ['entry', node({ reExport: sources(['*', ['last']]) })],
    ['last', node({}, true)],
  ]);
  const queries: [string, string][] = [];
  for (const path of ['source', '', 'entry', 'last', 'missing']) {
    for (const id of ['', '.', 'value', 'value.member', '.member', 'value.']) queries.push([path, id]);
  }
  compare(graph, new Set(['', 'entry', 'last', 'missing']), queries);
});

test('Native usage preserves every UTF-16 code unit in paths, ids, namespaces and result sets', () => {
  const names = ['🚀', '\ud800', '\udfff', 'é', 'e\u0301', '\ufffd', 'nul\0name', '点.名', ':', ''];
  for (const name of names) {
    const path = `/${name}/source`;
    const entry = `/${name}/entry`;
    const ns = `${name}Namespace`;
    const graph: ModuleGraph = new Map([
      [path, node({ reExportAs: aliases([name, [[ns, [entry]]]]), importNs: sources([ns, []]), refs: new Set([ns]) })],
      [entry, node({ enumerated: new Set([ns]) })],
    ]);
    compare(
      graph,
      new Set([entry]),
      [
        [path, name],
        [path, `${name}.member`],
        [entry, ns],
      ],
      JSON.stringify(name)
    );
  }
  const graph: ModuleGraph = new Map([
    ['\ud800', node({ import: sources(['\ud800', []]) })],
    ['\udfff', node({})],
    ['\ufffd', node({ import: sources(['\udfff', []]) })],
  ]);
  compare(graph, new Set(['\udfff']), [
    ['\ud800', '\ud800'],
    ['\ud800', '\udfff'],
    ['\udfff', '\ud800'],
    ['\ufffd', '\ud800'],
  ]);
});

test('Native usage takes one immutable snapshot and returns independent ordered sets', () => {
  const graph: ModuleGraph = new Map([['source', node({ reExport: sources(['value', ['entry']]) })]]);
  const entries = new Set(['entry']);
  const native = createNativeGraphUsage(graph, entries);
  graph.clear();
  entries.clear();
  const options = { traverseEntries: false };
  const result = native.isReferenced('source', 'value', options);
  result[2]?.add('mutated');
  assert.deepEqual(ordered(native.isReferenced('source', 'value', options)), [false, 'entry', ['value']]);
});

test('Public explorer construction and local queries do not snapshot or scan the graph', () => {
  class DemandGraph extends Map<string, ReturnType<typeof node>> {
    override [Symbol.iterator](): MapIterator<[string, ReturnType<typeof node>]> {
      throw new Error('Unexpected graph scan');
    }
    override entries(): MapIterator<[string, ReturnType<typeof node>]> {
      throw new Error('Unexpected graph scan');
    }
    override values(): MapIterator<ReturnType<typeof node>> {
      throw new Error('Unexpected graph scan');
    }
    override keys(): MapIterator<string> {
      throw new Error('Unexpected graph scan');
    }
  }
  const graph = new DemandGraph([['source', node({ import: sources(['value', []]) })]]);
  const explorer = createGraphExplorer(graph, new Set());
  assert.equal(explorer.isReferenced('source', 'value', { traverseEntries: true })[0], true);
  assert.deepEqual(explorer.hasStrictlyNsReferences('source', 'value'), [false]);
  assert.equal(explorer.isEnumerated('source', 'value'), false);
});

test('Native usage matches all tuples and ordered sets on deterministic generated graphs', () => {
  const ids = [
    'value',
    'other',
    'default',
    '*',
    '__opaque',
    '__loader-default',
    'NS',
    'NS.member',
    '',
    '.',
    'x:y',
    '🚀',
    '\ud800',
  ];
  const queryIds = [...ids, 'value.member', 'other..member', 'unknown', '\udfff', 'NS.'];
  for (let seed = 1; seed <= 120; seed++) {
    let state = seed;
    const random = (limit: number) => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return Math.floor((state / 4294967296) * limit);
    };
    const paths = ['source', 'barrel', 'entry', 'x', 'x:y', '', '\ud800', 'missing'];
    const randomSources = (): IdToFileMap => {
      const map: IdToFileMap = new Map();
      const count = random(5);
      for (let index = 0; index < count; index++) {
        const targetPaths = new Set<string>();
        const targetCount = random(4);
        for (let target = 0; target < targetCount; target++) targetPaths.add(paths[random(paths.length)]);
        map.set(ids[random(ids.length)], targetPaths);
      }
      return map;
    };
    const randomAliases = (): IdToNsToFileMap => {
      const map: IdToNsToFileMap = new Map();
      const count = random(4);
      for (let index = 0; index < count; index++) map.set(ids[random(ids.length)], randomSources());
      return map;
    };
    const graph: ModuleGraph = new Map();
    const entries = new Set<string>();
    for (const path of paths) {
      if (random(3) === 0) entries.add(path);
      if (path === 'missing' || random(6) === 0) continue;
      if (random(5) === 0) {
        graph.set(path, node(undefined, random(2) === 0, random(2) === 0));
        continue;
      }
      const refs = new Set<string>();
      const enumerated = random(3) === 0 ? undefined : new Set<string>();
      for (const id of ids) {
        if (random(4) === 0) refs.add(id);
        if (random(4) === 0) refs.add(`${id}.${ids[random(ids.length)]}`);
        if (random(5) === 0) enumerated?.add(id);
      }
      graph.set(
        path,
        node(
          {
            refs,
            enumerated,
            import: randomSources(),
            importAs: randomAliases(),
            importNs: randomSources(),
            reExport: randomSources(),
            reExportAs: randomAliases(),
            reExportNs: randomSources(),
          },
          random(4) === 0,
          random(2) === 0
        )
      );
    }
    const queries: [string, string][] = [];
    for (const path of paths) {
      for (const id of queryIds) queries.push([path, id]);
    }
    compare(graph, entries, queries, `seed=${seed}`);
  }
});

test('Native usage validates compact snapshot lengths, string indexes and node flags', () => {
  const require = createRequire(import.meta.url);
  const binding: { NativeUsageGraph: new (strings: string[], data: Uint32Array) => unknown } = require('knip/native');
  const valid = Uint32Array.of(0, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0);
  assert.doesNotThrow(() => new binding.NativeUsageGraph(['source'], valid));
  assert.doesNotThrow(() => new binding.NativeUsageGraph([], Uint32Array.of(0, 0)));
  for (let end = 0; end < valid.length; end++) {
    assert.throws(() => new binding.NativeUsageGraph(['source'], valid.subarray(0, end)), /usage graph/);
  }
  const invalid: [string[], number[]][] = [
    [[], [1, 0, 0]],
    [[], [0, 1, 0, 0]],
    [['source'], [0, 1, 0, 8]],
    [['source'], [0, 1, 0, 4, 0, 4294967295]],
    [['source'], [0, 1, 4294967295, 0]],
    [['source'], [0, 4294967295]],
    [[], [0, 0, 1]],
    [
      ['same', 'same'],
      [0, 0],
    ],
  ];
  for (const [strings, data] of invalid) {
    assert.throws(() => new binding.NativeUsageGraph(strings, Uint32Array.from(data)), /usage graph/);
  }
});
