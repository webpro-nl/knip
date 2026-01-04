import type {
  FileNode,
  IdToFileMap,
  IdToNsToFileMap,
  ImportMap,
  ImportMaps,
  ModuleGraph,
} from '../types/module-graph.js';

const updateImportMaps = (fromImportMaps: ImportMaps, toImportMaps: ImportMaps) => {
  for (const id of fromImportMaps.refs) toImportMaps.refs.add(id);
  for (const [id, v] of fromImportMaps.import) addValues(toImportMaps.import, id, v);
  for (const [id, v] of fromImportMaps.importAs) addNsValues(toImportMaps.importAs, id, v);
  for (const [id, v] of fromImportMaps.importNs) addValues(toImportMaps.importNs, id, v);
  for (const [id, v] of fromImportMaps.reExport) addValues(toImportMaps.reExport, id, v);
  for (const [id, v] of fromImportMaps.reExportAs) addNsValues(toImportMaps.reExportAs, id, v);
  for (const [id, v] of fromImportMaps.reExportNs) addValues(toImportMaps.reExportNs, id, v);
};

export const updateImportMap = (file: FileNode, importMap: ImportMap, graph: ModuleGraph) => {
  for (const [importedByFilePath, fileImportMaps] of importMap) {
    const importMaps = file.imports.internal.get(importedByFilePath);
    if (!importMaps) file.imports.internal.set(importedByFilePath, fileImportMaps);
    else updateImportMaps(fileImportMaps, importMaps);

    const importedByFile = graph.get(importedByFilePath) ?? createFileNode();
    if (!importedByFile.importedBy) importedByFile.importedBy = createImports();
    updateImportMaps(fileImportMaps, importedByFile.importedBy);

    graph.set(importedByFilePath, importedByFile);
  }
};

export const createFileNode = (): FileNode => ({
  imports: {
    internal: new Map(),
    external: new Set(),
    externalRefs: new Set(),
    unresolved: new Set(),
    programFiles: new Set(),
    entryFiles: new Set(),
    imports: new Set(),
  },
  exports: new Map(),
  duplicates: new Set(),
  scripts: new Set(),
  importedBy: undefined,
  internalImportCache: undefined,
});

export const createImports = (): ImportMaps => ({
  refs: new Set(),
  import: new Map(),
  importAs: new Map(),
  importNs: new Map(),
  reExport: new Map(),
  reExportAs: new Map(),
  reExportNs: new Map(),
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
