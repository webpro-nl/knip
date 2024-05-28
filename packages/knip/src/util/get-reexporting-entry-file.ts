import type { SerializableImports, SerializableMap } from '../types/serializable-map.js';
import { exportLookupLog } from './debug.js';

export const getReExportingEntryFileHandler = (entryPaths: Set<string>, serializableMap: SerializableMap) => {
  const getReExportingEntryFile = (
    importedModule: SerializableImports | undefined,
    id: string,
    depth = 0,
    filePath?: string
  ): string | undefined => {
    if (depth === 0 && filePath) exportLookupLog(-1, `Looking up re-exporting file for "${id}" from`, filePath);

    if (!importedModule) return undefined;

    const reExportedBy = importedModule.reExportedBy.get(id) ?? importedModule.reExportedBy.get('*');

    if (reExportedBy) {
      for (const byFilePath of reExportedBy) {
        if (entryPaths.has(byFilePath)) {
          exportLookupLog(depth, 're-exported by entry', byFilePath);
          return byFilePath;
        }
        exportLookupLog(depth, 're-exported by', byFilePath);
        const file = getReExportingEntryFile(serializableMap.get(byFilePath)?.imported, id, depth + 1);
        if (file) return file;
      }
    }

    const reExportedAs = importedModule.reExportedAs.get(id);

    if (reExportedAs) {
      for (const [alias, byFilePath] of reExportedAs) {
        if (entryPaths.has(byFilePath)) {
          exportLookupLog(depth, `re-exported as ${alias} by entry`, byFilePath);
          return byFilePath;
        }
        const file = getReExportingEntryFile(serializableMap.get(byFilePath)?.imported, alias, depth + 1);
        if (file) return file;
      }
    }

    for (const ns of importedModule.importedNs) {
      const reExportedAs = importedModule.reExportedAs.get(ns);

      if (reExportedAs) {
        for (const [alias, byFilePath] of reExportedAs) {
          if (entryPaths.has(byFilePath)) {
            exportLookupLog(depth, `re-exported as ${alias} by entry`, byFilePath);
            return byFilePath;
          }
          const file = getReExportingEntryFile(serializableMap.get(byFilePath)?.imported, alias, depth + 1);
          if (file) return file;
        }
      }

      const reExportedNs = importedModule.reExportedNs.get(ns);

      if (reExportedNs) {
        for (const filePath of reExportedNs) {
          if (entryPaths.has(filePath)) {
            exportLookupLog(depth, `re-exported on ${ns} by entry`, filePath);
            return filePath;
          }
          const file = getReExportingEntryFile(serializableMap.get(filePath)?.imported, `${ns}.${id}`, depth + 1);
          if (file) return file;
        }
      }
    }

    for (const [ns, filePaths] of importedModule.reExportedNs.entries()) {
      for (const filePath of filePaths) {
        if (entryPaths.has(filePath)) {
          exportLookupLog(depth, `re-exported on ${ns} by entry`, filePath);
          return filePath;
        }
      }
    }

    exportLookupLog(depth, `${id} is not re-exported by entry file`, '');
  };

  return getReExportingEntryFile;
};
