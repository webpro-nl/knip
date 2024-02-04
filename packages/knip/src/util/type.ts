import type { SerializableImports } from '../types/imports.js';

export const hasStrictlyNsReference = (importsForExport: SerializableImports) => {
  if (!importsForExport || !importsForExport.hasStar || importsForExport.importedNs.size === 0) return false;
  for (const ns of importsForExport.importedNs) {
    const hasNs = importsForExport.identifiers.has(ns);
    if (!hasNs) return false;
    for (const id of importsForExport.identifiers) if (id.startsWith(ns + '.')) return false;
  }
  return true;
};

export const getType = (hasOnlyNsReference: boolean, isType: boolean, hasNsImport: boolean) =>
  hasOnlyNsReference
    ? isType
      ? 'nsType'
      : 'nsExport'
    : isType
      ? hasNsImport
        ? 'nsTypes'
        : 'types'
      : hasNsImport
        ? 'nsExports'
        : 'exports';
