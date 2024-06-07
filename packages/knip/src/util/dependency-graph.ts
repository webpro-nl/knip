import type { FileNode, IdToFileMap, IdToNsToFileMap, ImportDetails } from '../types/dependency-graph.js';

export const createFileNode = (): FileNode => ({
  imports: {
    internal: new Map(),
    external: new Set(),
    unresolved: new Set(),
  },
  exports: {
    exported: new Map(),
    duplicate: new Set(),
  },
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

export const addValues = (map: IdToFileMap, id: string, values: Set<string>) => {
  if (map.has(id)) for (const v of values) map.get(id)?.add(v);
  else map.set(id, values);
};

export const addNsValues = (map: IdToNsToFileMap, id: string, value: IdToFileMap) => {
  // @ts-expect-error come on
  if (map.has(id)) for (const [ns, v] of value) addValues(map.get(id), ns, v);
  else map.set(id, value);
};
