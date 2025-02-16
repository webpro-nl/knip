import type {
  FileNode,
  IdToFileMap,
  IdToNsToFileMap,
  ImportDetails,
  ImportMap,
  ModuleGraph,
} from '../types/module-graph.js';

export const getOrCreateFileNode = (graph: ModuleGraph, filePath: string) => graph.get(filePath) ?? createFileNode();

const updateImportDetails = (importedModule: ImportDetails, importItems: ImportDetails) => {
  for (const id of importItems.refs) importedModule.refs.add(id);
  for (const [id, v] of importItems.imported.entries()) addValues(importedModule.imported, id, v);
  for (const [id, v] of importItems.importedAs.entries()) addNsValues(importedModule.importedAs, id, v);
  for (const [id, v] of importItems.importedNs.entries()) addValues(importedModule.importedNs, id, v);
  for (const [id, v] of importItems.reExported.entries()) addValues(importedModule.reExported, id, v);
  for (const [id, v] of importItems.reExportedAs.entries()) addNsValues(importedModule.reExportedAs, id, v);
  for (const [id, v] of importItems.reExportedNs.entries()) addValues(importedModule.reExportedNs, id, v);
};

export const updateImportMap = (file: FileNode, importMap: ImportMap, graph: ModuleGraph) => {
  for (const [importedFilePath, importDetails] of importMap.entries()) {
    const importedFileImports = file.imports.internal.get(importedFilePath);
    if (!importedFileImports) file.imports.internal.set(importedFilePath, importDetails);
    else updateImportDetails(importedFileImports, importDetails);

    const importedFile = getOrCreateFileNode(graph, importedFilePath);
    if (!importedFile.imported) importedFile.imported = importDetails;
    else updateImportDetails(importedFile.imported, importDetails);

    graph.set(importedFilePath, importedFile);
  }
};

const createFileNode = (): FileNode => ({
  imports: {
    internal: new Map(),
    external: new Set(),
    unresolved: new Set(),
  },
  exports: new Map(),
  duplicates: new Set(),
  scripts: new Set(),
  traceRefs: new Set(),
});

export const createImports = (): ImportDetails => ({
  refs: new Set(),
  imported: new Map(),
  importedAs: new Map(),
  importedNs: new Map(),
  reExported: new Map(),
  reExportedAs: new Map(),
  reExportedNs: new Map(),
});

export const addValue = (map: IdToFileMap, id: string, value: string) => {
  if (map.has(id)) map.get(id)?.add(value);
  else map.set(id, new Set([value]));
};

export const addNsValue = (map: IdToNsToFileMap, id: string, ns: string, value: string) => {
  if (map.has(id)) {
    if (map.get(id)?.has(ns)) map.get(id)?.get(ns)?.add(value);
    else map.get(id)?.set(ns, new Set([value]));
  } else {
    map.set(id, new Map([[ns, new Set([value])]]));
  }
};

const addValues = (map: IdToFileMap, id: string, values: Set<string>) => {
  if (map.has(id)) for (const v of values) map.get(id)?.add(v);
  else map.set(id, values);
};

const addNsValues = (map: IdToNsToFileMap, id: string, value: IdToFileMap) => {
  // @ts-expect-error come on
  if (map.has(id)) for (const [ns, v] of value) addValues(map.get(id), ns, v);
  else map.set(id, value);
};
