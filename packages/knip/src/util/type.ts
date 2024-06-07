import { IMPORT_STAR } from '../constants.js';
import type { SerializableImports, SerializableMap } from '../types/serializable-map.js';

export const getHasStrictlyNsReferences = (
  serializableMap: SerializableMap,
  importsForExport: SerializableImports | undefined
): [boolean, string?] => {
  if (!importsForExport) return [false];

  if (importsForExport.importedNs.size === 0 && !importsForExport.reExportedBy.has(IMPORT_STAR)) {
    return [false];
  }

  let namespace: string | undefined;

  for (const ns of importsForExport.importedNs.keys()) {
    const hasNs = importsForExport.refs.has(ns);
    if (!hasNs) return [false, ns];
    for (const id of importsForExport.refs) if (id.startsWith(`${ns}.`)) return [false, ns];

    const byFilePaths = importsForExport.reExportedNs.get(ns);
    if (byFilePaths) {
      for (const filePath of byFilePaths) {
        const file = serializableMap.get(filePath);
        if (file?.imported) {
          const hasStrictlyNsReferences = getHasStrictlyNsReferences(serializableMap, file.imported);
          if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
        }
      }
    }

    const reExportedAs = importsForExport.reExportedAs.get(ns);
    if (reExportedAs) {
      for (const byFilePaths of reExportedAs.values()) {
        for (const filePath of byFilePaths) {
          const file = serializableMap.get(filePath);
          if (file?.imported) {
            const hasStrictlyNsReferences = getHasStrictlyNsReferences(serializableMap, file.imported);
            if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
          }
        }
      }
    }

    namespace = ns;
  }

  const byFilePaths = importsForExport.reExportedBy.get(IMPORT_STAR);
  if (byFilePaths) {
    for (const filePath of byFilePaths) {
      const file = serializableMap.get(filePath);
      if (file?.imported) {
        const hasStrictlyNsReferences = getHasStrictlyNsReferences(serializableMap, file.imported);
        if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
      }
    }
  }

  return [true, namespace];
};

export const getType = (hasOnlyNsReference: boolean, isType: boolean) =>
  hasOnlyNsReference ? (isType ? 'nsTypes' : 'nsExports') : isType ? 'types' : 'exports';
