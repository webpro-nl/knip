import assert from 'node:assert/strict';
import test from 'node:test';
import { hasStrictlyNsReference } from '../../src/util/type.js';
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
  assert(!hasStrictlyNsReference(base));
});

test('Strictly namespace refs (single ns)', () => {
  assert(
    hasStrictlyNsReference({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns']),
      identifiers: new Set(['ns']),
    })
  );
});

test('Strictly namespace refs (no id)', () => {
  assert(
    !hasStrictlyNsReference({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns']),
      identifiers: new Set([]),
    })
  );
});

test('Strictly namespace refs (single ns, no id)', () => {
  assert(
    !hasStrictlyNsReference({
      ...base,
      hasStar: true,
      importedNs: new Set([]),
      identifiers: new Set(['ns']),
    })
  );
});

test('Strictly namespace refs (multiple ns, no id)', () => {
  assert(
    !hasStrictlyNsReference({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns', 'ns2']),
      identifiers: new Set(['ns']),
    })
  );
});

test('Strictly namespace refs (member access)', () => {
  assert(
    !hasStrictlyNsReference({
      ...base,
      hasStar: true,
      importedNs: new Set(['ns']),
      identifiers: new Set(['ns', 'ns.prop']),
    })
  );
});

test('Strictly namespace refs (no star)', () => {
  assert(
    !hasStrictlyNsReference({
      ...base,
      hasStar: false,
      importedNs: new Set(['ns']),
      identifiers: new Set(['ns']),
    })
  );
});
