import { test } from 'bun:test';
import assert from 'node:assert/strict';
import type { DependencyGraph, ImportDetails } from '../../src/types/dependency-graph.js';
import { getHasStrictlyNsReferences } from '../../src/util/type.js';

const map: DependencyGraph = new Map();

const base: ImportDetails = {
  refs: new Set(),
  imported: new Map(),
  importedAs: new Map(),
  importedNs: new Map(),
  reExported: new Map(),
  reExportedAs: new Map(),
  reExportedNs: new Map(),
};

test('Strictly namespace refs (no namespaces)', () => {
  assert.deepStrictEqual(getHasStrictlyNsReferences(map, base), [false]);
});

test('Strictly namespace refs (single ns)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Map([['ns', new Set()]]),
      refs: new Set(['ns']),
    }),
    [true, 'ns']
  );
});

test('Strictly namespace refs (no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Map([['ns', new Set()]]),
      refs: new Set([]),
    }),
    [false, 'ns']
  );
});

test('Strictly namespace refs (single ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Map([]),
      refs: new Set(['ns']),
    }),
    [false]
  );
});

test('Strictly namespace refs (multiple ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Map([
        ['ns', new Set()],
        ['ns2', new Set()],
      ]),
      refs: new Set(['ns']),
    }),
    [false, 'ns2']
  );
});

test('Strictly namespace refs (member access)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Map([['ns', new Set()]]),
      refs: new Set(['ns', 'ns.prop']),
    }),
    [false, 'ns']
  );
});
