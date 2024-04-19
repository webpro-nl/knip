import type { SerializableImports, SerializableMap } from '../types/serializable-map.js';
import { exportLookupLog } from './debug.js';

export const getIsIdentifierReferencedHandler = (importedSymbols: SerializableMap) => {
  const isIdentifierReferenced = (
    filePath: string,
    id: string,
    importsForExport?: SerializableImports,
    depth = 0
  ): boolean => {
    if (depth === 0) exportLookupLog(-1, `Looking up export "${id}" from`, filePath);

    const ids = id.split('.');
    if (ids.length > 2 && ids.length !== new Set(ids).size) {
      exportLookupLog(depth, 'circular reference', filePath);
      return false;
    }

    if (!importsForExport) {
      exportLookupLog(depth, 'no imports found from', filePath);
      return false;
    }

    if (importsForExport.identifiers.has(id)) {
      exportLookupLog(depth, 'imported from', filePath);
      return true;
    }

    for (const ns of importsForExport.importedNs) {
      if (importsForExport.identifiers.has(`${ns}.${id}`)) {
        exportLookupLog(depth, `imported on ${ns} from`, filePath);
        return true;
      }
    }

    if (importsForExport.isReExport) {
      for (const filePath of importsForExport.isReExportedBy) {
        const file = importedSymbols[filePath];
        if (file && isIdentifierReferenced(filePath, id, file.imported, depth + 1)) {
          exportLookupLog(depth, 're-exported by', filePath);
          return true;
        }
      }

      for (const [filePath, alias] of importsForExport.isReExportedAs) {
        const file = importedSymbols[filePath];
        if (file && isIdentifierReferenced(filePath, alias, file.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported as ${alias} by`, filePath);
          return true;
        }
      }

      for (const [filePath, ns] of importsForExport.isReExportedNs) {
        const file = importedSymbols[filePath];
        if (file && isIdentifierReferenced(filePath, `${ns}.${id}`, file.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported on ${ns} by`, filePath);
          return true;
        }
      }
    }

    exportLookupLog(depth, 'not imported from', filePath);
    return false;
  };

  return isIdentifierReferenced;
};
