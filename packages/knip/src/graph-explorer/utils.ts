import type { ImportMaps } from '../types/module-graph.js';

export const hasStrictlyEnumReferences = (importsForExport: ImportMaps | undefined, identifier: string): boolean => {
  if (!importsForExport || !importsForExport.refs.has(identifier)) return false;
  for (const ref of importsForExport.refs) if (ref.startsWith(`${identifier}.`)) return false;
  return true;
};

export const getIssueType = (hasOnlyNsReference: boolean, isType: boolean) => {
  if (hasOnlyNsReference) return isType ? 'nsTypes' : 'nsExports';
  return isType ? 'types' : 'exports';
};
