import type { SerializableImports, SerializableMap } from '../types/map.js';
import { exportLookupLog } from './debug.js';

export const getReExportingEntryFileHandler = (entryPaths: Set<string>, serializableMap: SerializableMap) => {
  const getReExportingEntryFile = (
    importedModule: SerializableImports | undefined,
    id: string,
    depth = 0,
    filePath?: string
  ): string | undefined => {
    if (depth === 0 && filePath) exportLookupLog(-1, `Looking up re-exporting file for ${id} from`, filePath);

    if (!importedModule) return undefined;

    if (importedModule.isReExport) {
      for (const filePath of importedModule.isReExportedBy) {
        if (entryPaths.has(filePath)) {
          if (filePath in serializableMap && id in serializableMap[filePath].exports) {
            exportLookupLog(depth, 're-exported by entry', filePath);
            return filePath;
          }
          if (importedModule.hasStar) {
            exportLookupLog(depth, 're-exported (*) by entry', filePath);
            return filePath;
          }
        } else {
          exportLookupLog(depth, 're-exported by', filePath);
          const file = getReExportingEntryFile(serializableMap[filePath].imported, id, depth + 1);
          if (file) return file;
        }
      }

      for (const [filePath, namespace] of importedModule.isReExportedNs) {
        if (entryPaths.has(filePath)) {
          exportLookupLog(depth, `re-exported on ${namespace} by entry`, filePath);
          return filePath;
        }
        exportLookupLog(depth, `re-exported on ${namespace} by`, filePath);
        const file = getReExportingEntryFile(serializableMap[filePath].imported, namespace, depth + 1);
        if (file) return file;
      }

      for (const [filePath, alias] of importedModule.isReExportedAs) {
        if (entryPaths.has(filePath)) {
          exportLookupLog(depth, `re-exported as ${alias} by entry`, filePath);
          return filePath;
        }
        exportLookupLog(depth, `re-exported as ${alias} by`, filePath);
        const file = getReExportingEntryFile(serializableMap[filePath].imported, alias, depth + 1);
        if (file) return file;
      }
    }

    exportLookupLog(depth, `${id} is not re-exported by entry file`, '');
  };

  return getReExportingEntryFile;
};
