import { test } from 'bun:test';
import assert from 'node:assert/strict';
import type { ImportDetails, ModuleGraph } from '../../src/types/module-graph.js';
import { hasStrictlyNsReferences } from '../../src/util/has-strictly-ns-references.js';

const map: ModuleGraph = new Map();

const base: ImportDetails = {
  refs: new Set(),
  imported: new Map(),
  importedAs: new Map(),
  importedNs: new Map(),
  reExported: new Map(),
  reExportedAs: new Map(),
  reExportedNs: new Map(),
};

const id = 'id';

test('Strictly namespace refs (no namespaces)', () => {
  assert.deepStrictEqual(hasStrictlyNsReferences(map, base, id), [false]);
});

test('Strictly namespace refs (single ns)', () => {
  assert.deepStrictEqual(
    hasStrictlyNsReferences(
      map,
      {
        ...base,
        importedNs: new Map([['ns', new Set()]]),
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
      {
        ...base,
        importedNs: new Map([['ns', new Set()]]),
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
      {
        ...base,
        importedNs: new Map([]),
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
      {
        ...base,
        importedNs: new Map([
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
      {
        ...base,
        importedNs: new Map([['ns', new Set()]]),
        refs: new Set(['ns', 'ns.prop']),
      },
      id
    ),
    [false, 'ns']
  );
});
