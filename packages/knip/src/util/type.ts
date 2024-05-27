import type { SerializableImports, SerializableMap } from '../types/serializable-map.js';

export const getHasStrictlyNsReferences = (
  serializableMap: SerializableMap,
  importsForExport?: SerializableImports
): [boolean, string?] => {
  if (!importsForExport || (importsForExport.importedNs.size === 0 && !importsForExport.reExportedBy.has('*'))) {
    return [false];
  }

  let namespace: string | undefined;

  for (const ns of importsForExport.importedNs) {
    const hasNs = importsForExport.refs.has(ns);
    if (!hasNs) return [false, ns];
    for (const id of importsForExport.refs) if (id.startsWith(`${ns}.`)) return [false, ns];
    namespace = ns;
  }

  const reExports = importsForExport.reExportedBy.get('*');
  if (reExports) {
    for (const filePath of reExports) {
      const result = getHasStrictlyNsReferences(serializableMap, serializableMap[filePath].imported);
      if (!result[0]) return result;
    }
  }

  return [true, namespace];
};

export const getType = (hasOnlyNsReference: boolean, isType: boolean) =>
  hasOnlyNsReference ? (isType ? 'nsTypes' : 'nsExports') : isType ? 'types' : 'exports';
