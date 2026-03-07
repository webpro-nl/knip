import type { Export, FileNode, Import, ImportMaps } from '../../src/types/module-graph.ts';

export const baseImportMaps: ImportMaps = {
  refs: new Set(),
  import: new Map(),
  importAs: new Map(),
  importNs: new Map(),
  reExport: new Map(),
  reExportAs: new Map(),
  reExportNs: new Map(),
};

export const baseFileNode: FileNode = {
  imports: {
    internal: new Map(),
    external: new Set(),
    unresolved: new Set(),
    imports: new Set(),
    externalRefs: new Set(),
    programFiles: new Set(),
    entryFiles: new Set(),
  },
  exports: new Map(),
  duplicates: [],
  scripts: new Set(),
  importedBy: baseImportMaps,
  internalImportCache: undefined,
};

export const baseExport: Export = {
  identifier: 'identifier',
  pos: 0,
  line: 1,
  col: 0,
  type: 'unknown',
  members: [],
  jsDocTags: new Set(),
  hasRefsInFile: false,
  referencedIn: new Set(),
  isReExport: false,
  fixes: [],
};

export const getBaseImport = (filePath: string): Import => ({
  specifier: './module-1',
  filePath,
  identifier: 'identifier',
  isTypeOnly: false,
  pos: 0,
  line: 0,
  col: 0,
});
