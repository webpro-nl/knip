import { OPAQUE } from '../constants.js';
import type { ImportMaps, ModuleGraph } from '../types/module-graph.js';

export const hasNamespaceMemberReference = (
  graph: ModuleGraph,
  importingFile: string,
  importedFile: string,
  namespace: string,
  member: string
): boolean | null => {
  const importerNode = graph.get(importingFile);
  if (!importerNode) return null;

  const importMap = importerNode.imports.internal.get(importedFile);
  if (!importMap) return null;

  if (importMap.imported.get(OPAQUE)) return true;

  if (importMap.refs.size === 0) return false;

  const refKey = member ? `${namespace}.${member}` : namespace;
  return refKey ? importMap.refs.has(refKey) : null;
};

export const hasStrictlyEnumReferences = (importsForExport: ImportMaps | undefined, identifier: string): boolean => {
  if (!importsForExport || !importsForExport.refs.has(identifier)) return false;
  for (const ref of importsForExport.refs) if (ref.startsWith(`${identifier}.`)) return false;
  return true;
};

export const getIssueType = (hasOnlyNsReference: boolean, isType: boolean) => {
  if (hasOnlyNsReference) return isType ? 'nsTypes' : 'nsExports';
  return isType ? 'types' : 'exports';
};
