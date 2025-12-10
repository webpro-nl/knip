import type {
  FileNode,
  IdToFileMap,
  IdToNsToFileMap,
  ImportMap,
  ImportMaps,
  ModuleGraph,
} from '../types/module-graph.js';

export const getOrCreateFileNode = (graph: ModuleGraph, filePath: string) => graph.get(filePath) ?? createFileNode();

const updateImportMaps = (fromImportMaps: ImportMaps, toImportMaps: ImportMaps) => {
  for (const id of fromImportMaps.refs) toImportMaps.refs.add(id);
  for (const [id, v] of fromImportMaps.imported) addValues(toImportMaps.imported, id, v);
  for (const [id, v] of fromImportMaps.importedAs) addNsValues(toImportMaps.importedAs, id, v);
  for (const [id, v] of fromImportMaps.importedNs) addValues(toImportMaps.importedNs, id, v);
  for (const [id, v] of fromImportMaps.reExported) addValues(toImportMaps.reExported, id, v);
  for (const [id, v] of fromImportMaps.reExportedAs) addNsValues(toImportMaps.reExportedAs, id, v);
  for (const [id, v] of fromImportMaps.reExportedNs) addValues(toImportMaps.reExportedNs, id, v);
};

export const updateImportMap = (file: FileNode, importMap: ImportMap, graph: ModuleGraph) => {
  for (const [importedFilePath, fileImportMaps] of importMap) {
    const importMaps = file.imports.internal.get(importedFilePath);
    if (!importMaps) file.imports.internal.set(importedFilePath, fileImportMaps);
    else updateImportMaps(fileImportMaps, importMaps);

    const importedFile = getOrCreateFileNode(graph, importedFilePath);
    if (!importedFile.imported) importedFile.imported = createImports();
    updateImportMaps(fileImportMaps, importedFile.imported);

    graph.set(importedFilePath, importedFile);
  }
};

const createFileNode = (): FileNode => ({
  imports: {
    internal: new Map(),
    external: new Set(),
    unresolved: new Set(),
    programFiles: new Set(),
    entryFiles: new Set(),
    imports: new Set(),
  },
  exports: new Map(),
  duplicates: new Set(),
  scripts: new Set(),
});

export const createImports = (): ImportMaps => ({
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
