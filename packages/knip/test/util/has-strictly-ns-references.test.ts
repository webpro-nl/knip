import { test } from 'bun:test';
import assert from 'node:assert/strict';
import type { SerializableImports, SerializableMap } from '../../src/types/serializable-map.js';
import { getHasStrictlyNsReferences } from '../../src/util/type.js';

const map: SerializableMap = {};

const base: SerializableImports = {
  specifier: '',
  reExportedBy: new Map(),
  reExportedAs: new Map(),
  reExportedNs: new Map(),
  imported: new Set(),
  importedAs: new Map(),
  importedNs: new Set(),
  refs: new Set(),
};

test('Strictly namespace refs (no namespaces)', () => {
  assert.deepStrictEqual(getHasStrictlyNsReferences(map, base), [false]);
});

test('Strictly namespace refs (single ns)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Set(['ns']),
      refs: new Set(['ns']),
    }),
    [true, 'ns']
  );
});

test('Strictly namespace refs (no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Set(['ns']),
      refs: new Set([]),
    }),
    [false, 'ns']
  );
});

test('Strictly namespace refs (single ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Set([]),
      refs: new Set(['ns']),
    }),
    [false]
  );
});

test('Strictly namespace refs (multiple ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Set(['ns', 'ns2']),
      refs: new Set(['ns']),
    }),
    [false, 'ns2']
  );
});

test('Strictly namespace refs (member access)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences(map, {
      ...base,
      importedNs: new Set(['ns']),
      refs: new Set(['ns', 'ns.prop']),
    }),
    [false, 'ns']
  );
});
