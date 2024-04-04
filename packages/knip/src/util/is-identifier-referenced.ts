import { exportLookupLog } from './debug.js';
import type { SerializableImportMap, SerializableImports } from '../types/imports.js';

export const getIsIdentifierReferencedHandler = (importedSymbols: SerializableImportMap) => {
  const isIdentifierReferenced = (
    filePath: string,
    id: string,
    importsForExport?: SerializableImports,
    depth: number = 0
  ): boolean => {
    if (depth === 0) exportLookupLog(-1, `Looking up export "${id}" from`, filePath);

    if (!importsForExport) {
      exportLookupLog(depth, `no imports found from`, filePath);
      return false;
    }

    if (importsForExport.identifiers.has(id)) {
      exportLookupLog(depth, `imported from`, filePath);
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
        if (isIdentifierReferenced(filePath, id, importedSymbols[filePath], depth + 1)) {
          exportLookupLog(depth, `re-exported by`, filePath);
          return true;
        }
      }

      for (const [filePath, alias] of importsForExport.isReExportedAs) {
        if (isIdentifierReferenced(filePath, alias, importedSymbols[filePath], depth + 1)) {
          exportLookupLog(depth, `re-exported as ${alias} by`, filePath);
          return true;
        }
      }

      for (const [filePath, ns] of importsForExport.isReExportedNs) {
        if (isIdentifierReferenced(filePath, `${ns}.${id}`, importedSymbols[filePath], depth + 1)) {
          exportLookupLog(depth, `re-exported on ${ns} by`, filePath);
          return true;
        }
      }
    }

    exportLookupLog(depth, `not imported from`, filePath);
    return false;
  };

  return isIdentifierReferenced;
};
