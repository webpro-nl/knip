import { IMPORT_STAR } from '../constants.js';
import type { SerializableImports, SerializableMap } from '../types/serializable-map.js';
import { exportLookupLog } from './debug.js';

export const getIsIdentifierReferencedHandler = (importedSymbols: SerializableMap) => {
  const isIdentifierReferenced = (filePath: string, id: string, imports?: SerializableImports, depth = 0): boolean => {
    if (depth === 0) exportLookupLog(-1, `Looking up export "${id}" from`, filePath);

    const ids = id.split('.');
    const [identifier, ...rest] = ids;

    if (ids.length > 2 && ids.length !== new Set(ids).size) {
      exportLookupLog(depth, 'circular reference', filePath);
      return false;
    }

    if (!imports) {
      exportLookupLog(depth, 'no imports found from', filePath);
      return false;
    }

    if (ids.length > 1) {
      if (imports.refs.has(id)) {
        exportLookupLog(depth, `referenced ${id} from`, filePath);
        return true;
      }
    }

    if (imports.imported.has(id)) {
      exportLookupLog(depth, `imported ${id} from`, filePath);
      return true;
    }

    for (const [importId, aliases] of imports.importedAs.entries()) {
      if (aliases.has(identifier)) {
        if (ids.length > 1) {
          const aliasedRef = [importId, ...rest].join('.');
          if (imports.refs.has(aliasedRef)) {
            exportLookupLog(depth, `imported ${aliasedRef} from`, filePath);
            return true;
          }
        } else {
          exportLookupLog(depth, `imported ${id} as ${importId} from`, filePath);
          return true;
        }
      }
    }

    for (const namespace of imports.importedNs) {
      if (imports.refs.has(`${namespace}.${id}`)) {
        exportLookupLog(depth, `imported ${id} on ${namespace} from`, filePath);
        return true;
      }

      const reExportedAs = imports.reExportedAs.get(namespace);

      if (reExportedAs) {
        for (const [alias, byFilePath] of reExportedAs) {
          const importsFor = importedSymbols.get(byFilePath);
          if (importsFor && isIdentifierReferenced(byFilePath, alias, importsFor.imported, depth + 1)) {
            exportLookupLog(depth, `re-exported as ${alias} by`, byFilePath);
            return true;
          }
        }
      }

      const reExportedNs = imports.reExportedNs.get(namespace);

      if (reExportedNs) {
        for (const byFilePath of reExportedNs) {
          const importsFor = importedSymbols.get(byFilePath);
          if (importsFor && isIdentifierReferenced(byFilePath, `${namespace}.${id}`, importsFor.imported, depth + 1)) {
            exportLookupLog(depth, `re-exported on ${namespace} by`, byFilePath);
            return true;
          }
        }
      }
    }

    const reExportedBy = imports.reExportedBy.get(identifier) ?? imports.reExportedBy.get(IMPORT_STAR);

    if (reExportedBy) {
      for (const byFilePath of reExportedBy) {
        const importsFor = importedSymbols.get(byFilePath);
        if (importsFor && isIdentifierReferenced(byFilePath, id, importsFor.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported ${id} by`, byFilePath);
          return true;
        }
      }
    }

    const reExportedAs = imports.reExportedAs.get(identifier);

    if (reExportedAs) {
      for (const [alias, byFilePath] of reExportedAs) {
        const aliasedRef = [alias, ...rest].join('.');
        const importsFor = importedSymbols.get(byFilePath);
        if (importsFor && isIdentifierReferenced(byFilePath, aliasedRef, importsFor.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported as ${alias} by`, byFilePath);
          return true;
        }
      }
    }

    for (const [namespace, filePaths] of imports.reExportedNs.entries()) {
      for (const byFilePath of filePaths) {
        const importsFor = importedSymbols.get(byFilePath);
        if (importsFor && isIdentifierReferenced(byFilePath, `${namespace}.${id}`, importsFor.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported on ${namespace} by`, byFilePath);
          return true;
        }
      }
    }

    exportLookupLog(depth, 'not imported from', filePath);
    return false;
  };

  return isIdentifierReferenced;
};
