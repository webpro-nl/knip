import assert from 'node:assert/strict';
import test from 'node:test';
import { IMPORT_STAR } from '../../src/constants.js';
import { walkDown } from '../../src/graph-explorer/walk-down.js';
import type { Export, FileNode, Import, ImportMaps, ModuleGraph } from '../../src/types/module-graph.js';
import { resolve } from '../helpers/resolve.js';

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('module-1.ts');
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

const baseExport: Export = {
  identifier: 'identifier',
  pos: 0,
  line: 1,
  col: 0,
  type: 'unknown',
  members: [],
  jsDocTags: new Set(),
  refs: [0, false],
  fixes: [],
};

const baseImport: Import = {
  specifier: './module-1',
  filePath: filePath1,
  identifier: 'identifier',
  isTypeOnly: false,
  pos: 0,
  line: 0,
  col: 0,
};

test('should find direct importers', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      imported: new Map([['identifier', new Set([filePath2])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [
          filePath1,
          {
            ...baseImportMaps,
            imported: new Map([['identifier', new Set([filePath2])]]),
          },
        ],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([baseImport]),
    },
  });

  const importers: string[] = [];
  walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, importingFile, _identifier, _isEntry, _isReExport) => {
      importers.push(importingFile);
      return undefined;
    },
    entryPaths
  );

  assert.equal(importers.length, 1);
  assert.equal(importers[0], filePath2);
});

test('should find aliased importers', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      importedAs: new Map([['identifier', new Map([['alias', new Set([filePath2])]])]]),
    },
  });

  graph.set(filePath2, { ...baseFileNode });

  const importers: Array<{ file: string; identifier: string }> = [];
  walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, importingFile, identifier, _isEntry, _isReExport) => {
      importers.push({ file: importingFile, identifier });
      return undefined;
    },
    entryPaths
  );

  assert.equal(importers.length, 1);
  assert.equal(importers[0].file, filePath2);
  assert.equal(importers[0].identifier, 'alias');
});

test('should follow re-export chain', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      reExported: new Map([['identifier', new Set([filePath2])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imported: {
      ...baseImportMaps,
      imported: new Map([['identifier', new Set([filePath3])]]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath2, { ...baseImportMaps, imported: new Map([['identifier', new Set([filePath3])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, specifier: './module-2', filePath: filePath2 }]),
    },
  });

  const importers: string[] = [];
  walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, importingFile, _identifier, _isEntry, _isReExport) => {
      importers.push(importingFile);
      return undefined;
    },
    entryPaths
  );

  assert.ok(importers.includes(filePath3));
});

test('should mark entry files correctly', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath2]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      imported: new Map([['identifier', new Set([filePath2])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, imported: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([baseImport]),
    },
  });

  let isEntryFound = false;
  walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, _importingFile, _identifier, isEntry, _isReExport) => {
      if (isEntry) isEntryFound = true;
      return undefined;
    },
    entryPaths
  );

  assert.equal(isEntryFound, true);
});

test('should bail out early when visitor returns stop', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      imported: new Map([['identifier', new Set([filePath2, filePath3])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [
          filePath1,
          {
            ...baseImportMaps,
            imported: new Map([['identifier', new Set([filePath2])]]),
          },
        ],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([baseImport]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, imported: new Map([['identifier', new Set([filePath3])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([baseImport]),
    },
  });

  const importers: string[] = [];
  const stopped = walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, importingFile, _identifier, _isEntry, _isReExport) => {
      importers.push(importingFile);
      return 'stop';
    },
    entryPaths
  );

  assert.equal(stopped, true);
  assert.equal(importers.length, 1);
});

test('should handle circular imports without infinite loop', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      imported: new Map([['identifier', new Set([filePath2])]]),
      reExported: new Map([['alias', new Set([filePath2])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['alias', { ...baseExport, identifier: 'alias' }]]),
    imported: {
      ...baseImportMaps,
      imported: new Map([['alias', new Set([filePath1])]]),
      reExported: new Map([['identifier', new Set([filePath1])]]),
    },
  });

  const importers: string[] = [];
  const stopped = walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, importingFile, _identifier, _isEntry, _isReExport) => {
      importers.push(importingFile);
      return undefined;
    },
    entryPaths
  );

  assert.equal(stopped, false);

  assert.ok(importers.length <= 4);
});

test('should handle namespace imports with member refs', () => {
  const graph = createGraph();
  const entryPaths = new Set<string>();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      importedNs: new Map([['NS', new Set([filePath2])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [
          filePath1,
          { ...baseImportMaps, refs: new Set(['NS.identifier']), importedNs: new Map([['NS', new Set([filePath2])]]) },
        ],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([{ ...baseImport, identifier: IMPORT_STAR }]),
    },
  });

  const importers: Array<{ file: string; identifier: string }> = [];
  walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, importingFile, identifier, _isEntry, _isReExport) => {
      importers.push({ file: importingFile, identifier });
      return undefined;
    },
    entryPaths
  );

  assert.equal(importers.length, 1);
  assert.equal(importers[0].file, filePath2);
  assert.equal(importers[0].identifier, 'NS.identifier');
});

test('should visitor receives correct isEntry and isReExport flags', () => {
  const graph = createGraph();
  const entryPaths = new Set([filePath2]);

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
    imported: {
      ...baseImportMaps,
      imported: new Map([['identifier', new Set([filePath2])]]),
      reExported: new Map([['identifier', new Set([filePath3])]]),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, imported: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([baseImport]),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath3])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set([baseImport]),
    },
    imported: {
      ...baseImportMaps,
      imported: new Map([['identifier', new Set([filePath2])]]),
    },
  });

  const results: Array<{ file: string; isEntry: boolean; isReExport: boolean }> = [];
  walkDown(
    graph,
    filePath1,
    'identifier',
    (_sourceFile, _sourceId, importingFile, _identifier, isEntry, isReExport) => {
      results.push({ file: importingFile, isEntry, isReExport });
      return undefined;
    },
    entryPaths
  );

  const file2Result = results.find(r => r.file === filePath2);
  assert.ok(file2Result !== undefined);
  assert.equal(file2Result?.isEntry, true);
  assert.equal(file2Result?.isReExport, false);
});
