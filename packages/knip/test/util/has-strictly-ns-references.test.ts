import assert from 'node:assert/strict';
import test from 'node:test';
import { getHasStrictlyNsReferences } from '../../src/util/type.js';
import type { SerializableImports } from '../../src/types/imports.js';

const base: SerializableImports = {
  specifier: '',
  isReExport: false,
  isReExportedBy: new Set(),
  isReExportedAs: new Set(),
  isReExportedNs: new Set(),
  hasStar: false,
  importedNs: new Set(),
  identifiers: new Set(),
};

test('Strictly namespace refs (no namespaces)', () => {
  assert.deepStrictEqual(getHasStrictlyNsReferences(base), [false]);
});

test('Strictly namespace refs (single ns)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns']),
      identifiers: new Set(['ns']),
    }),
    [true, 'ns']
  );
});

test('Strictly namespace refs (no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns']),
      identifiers: new Set([]),
    }),
    [false, 'ns']
  );
});

test('Strictly namespace refs (single ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      hasStar: true,
      importedNs: new Set([]),
      identifiers: new Set(['ns']),
    }),
    [false]
  );
});

test('Strictly namespace refs (multiple ns, no id)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns', 'ns2']),
      identifiers: new Set(['ns']),
    }),
    [false, 'ns2']
  );
});

test('Strictly namespace refs (member access)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns']),
      identifiers: new Set(['ns', 'ns.prop']),
    }),
    [false, 'ns']
  );
});

test('Strictly namespace refs (no star)', () => {
  assert.deepStrictEqual(
    getHasStrictlyNsReferences({
      ...base,
      hasStar: false,
      importedNs: new Set(['ns']),
      identifiers: new Set(['ns']),
    }),
    [false]
  );
});
