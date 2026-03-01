import assert from 'node:assert/strict';
import test from 'node:test';
import { hasStrictlyNsReferences } from '../../src/graph-explorer/operations/has-strictly-ns-references.ts';
import type { ImportMaps, ModuleGraph } from '../../src/types/module-graph.ts';

const map: ModuleGraph = new Map();

const base: ImportMaps = {
  refs: new Set(),
  import: new Map(),
  importAs: new Map(),
  importNs: new Map(),
  reExport: new Map(),
  reExportAs: new Map(),
  reExportNs: new Map(),
};

const filePath = 'test.ts';
const id = 'id';

test('Strictly namespace refs (no namespaces)', () => {
  assert.deepStrictEqual(hasStrictlyNsReferences(map, filePath, base, id), [false]);
});

test('Strictly namespace refs (single ns)', () => {
  assert.deepStrictEqual(
    hasStrictlyNsReferences(
      map,
      filePath,
      {
        ...base,
        importNs: new Map([['ns', new Set()]]),
        refs: new Set(['ns']),
      },
      id
    ),
    [true, 'ns']
  );
});

test('Strictly namespace refs (no id)', () => {
  assert.deepStrictEqual(
    hasStrictlyNsReferences(
      map,
      filePath,
      {
        ...base,
        importNs: new Map([['ns', new Set()]]),
        refs: new Set([]),
      },
      id
    ),
    [false, 'ns']
  );
});

test('Strictly namespace refs (single ns, no id)', () => {
  assert.deepStrictEqual(
    hasStrictlyNsReferences(
      map,
      filePath,
      {
        ...base,
        importNs: new Map([]),
        refs: new Set(['ns']),
      },
      id
    ),
    [false]
  );
});

test('Strictly namespace refs (multiple ns, no id)', () => {
  assert.deepStrictEqual(
    hasStrictlyNsReferences(
      map,
      filePath,
      {
        ...base,
        importNs: new Map([
          ['ns', new Set()],
          ['ns2', new Set()],
        ]),
        refs: new Set(['ns']),
      },
      id
    ),
    [false, 'ns2']
  );
});

test('Strictly namespace refs (member access)', () => {
  assert.deepStrictEqual(
    hasStrictlyNsReferences(
      map,
      filePath,
      {
        ...base,
        importNs: new Map([['ns', new Set()]]),
        refs: new Set(['ns', 'ns.prop']),
      },
      id
    ),
    [false, 'ns']
  );
});
