import assert from 'node:assert/strict';
import test from 'node:test';
import { OPAQUE } from '../../src/constants.js';
import type { FileNode, ImportMaps, ModuleGraph } from '../../src/types/module-graph.js';
import { getIsIdentifierReferencedHandler } from '../../src/util/is-identifier-referenced.js';
import { resolve } from '../helpers/resolve.js';

const createGraph = (): ModuleGraph => new Map();

const filePath = resolve('module-1.ts');
const filePath2 = resolve('module-2.ts');
const filePath3 = resolve('module-3.ts');

const baseFileNode: FileNode = {
  imports: { internal: new Map(), external: new Set(), unresolved: new Set(), resolved: new Set(), imports: new Set() },
  exports: new Map(),
  duplicates: [],
  scripts: new Set(),
  traceRefs: new Set(),
};

const baseImportMaps: ImportMaps = {
  refs: new Set(),
  imported: new Map(),
  importedAs: new Map(),
  importedNs: new Map(),
  reExported: new Map(),
  reExportedAs: new Map(),
  reExportedNs: new Map(),
};

test('No reference', () => {
  const graph = createGraph();
  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, new Set(), false);
  const { isReferenced } = isIdentifierReferenced(filePath, 'test-id');
  assert.equal(isReferenced, false);
});

test('Direct reference', () => {
  const graph = createGraph();

  graph.set(filePath, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      refs: new Set(['test-id']),
      imported: new Map([['test-id', new Set([filePath2])]]),
    },
  });

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, new Set(), false);
  const { isReferenced } = isIdentifierReferenced(filePath, 'test-id');
  assert.equal(isReferenced, true);
});

test('isIdentifierReferenced: Namespaced reference', () => {
  const graph = createGraph();

  graph.set(filePath, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      refs: new Set(['MyNamespace.test-id']),
      imported: new Map([['MyNamespace', new Set([filePath2])]]),
    },
  });

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, new Set(), false);
  const { isReferenced } = isIdentifierReferenced(filePath, 'MyNamespace.test-id');
  assert.equal(isReferenced, true);
});

test('Re-exported and used', () => {
  const graph = createGraph();

  graph.set(filePath, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      reExported: new Map([['test-id', new Set([filePath2])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      refs: new Set(['test-id']),
      imported: new Map([['test-id', new Set([filePath])]]),
    },
  });

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, new Set(), false);
  const { isReferenced } = isIdentifierReferenced(filePath, 'test-id');
  assert.equal(isReferenced, true);
});

test('Aliased import and used', () => {
  const graph = createGraph();

  graph.set(filePath, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      refs: new Set(['test-alias']),
      importedAs: new Map([['test-id', new Map([['test-alias', new Set([filePath2])]])]]),
    },
  });

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, new Set(), false);
  const { isReferenced } = isIdentifierReferenced(filePath, 'test-id');
  assert.equal(isReferenced, true);
});

test('Aliased re-export and used', () => {
  const graph = createGraph();

  graph.set(filePath, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      reExportedAs: new Map([['test-id', new Map([['test-alias', new Set([filePath2])]])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      refs: new Set(['test-alias']),
      imported: new Map([['test-alias', new Set([filePath3])]]),
    },
  });

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, new Set(), false);
  const { isReferenced } = isIdentifierReferenced(filePath, 'test-id');
  assert.equal(isReferenced, true);
});

test('Opaque import', () => {
  const graph = createGraph();

  graph.set(filePath, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      imported: new Map([[OPAQUE, new Set()]]),
    },
  });

  const isIdentifierReferenced = getIsIdentifierReferencedHandler(graph, new Set(), false);
  const { isReferenced } = isIdentifierReferenced(filePath, 'anyVar');
  assert.equal(isReferenced, true);
});
