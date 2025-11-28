import { OPAQUE } from '../constants.js';
import type { Import, ImportMaps, ModuleGraph } from '../types/module-graph.js';
import { getCachedExportedIdentifiers, setCachedExportedIdentifiers } from './cache.js';
import {
  forEachAliasReExport,
  forEachNamespaceReExport,
  forEachPassThroughReExport,
  getStarReExportSources,
} from './visitors.js';

export const getExportedIdentifiers = (
  graph: ModuleGraph,
  filePath: string,
  visited = new Set<string>()
): Map<string, boolean> => {
  if (visited.has(filePath)) return new Map();
  visited.add(filePath);

  const cached = getCachedExportedIdentifiers(graph, filePath);
  if (cached) return cached;

  const node = graph.get(filePath);
  if (!node) return new Map();

  const identifiers = new Map<string, boolean>();

  const addIdentifier = (identifier: string, isDuplicate = false) => {
    if (identifiers.has(identifier)) {
      identifiers.set(identifier, true);
    } else {
      identifiers.set(identifier, isDuplicate);
    }
  };

  for (const identifier of node.exports.keys()) {
    if (identifier === 'default') continue;
    addIdentifier(identifier);
  }

  if (node.imports?.internal) {
    for (const [importedPath, importDetails] of node.imports.internal) {
      forEachPassThroughReExport(importDetails, (id, _sources) => {
        if (id !== 'default') addIdentifier(id);
      });

      forEachAliasReExport(importDetails, (_id, alias, _sources) => {
        addIdentifier(alias);
      });

      forEachNamespaceReExport(importDetails, (namespace, _sources) => {
        addIdentifier(namespace, true);
      });

      const starSources = getStarReExportSources(importDetails);
      if (starSources) {
        const nestedIdentifiers = getExportedIdentifiers(graph, importedPath, new Set(visited));
        for (const [nestedId, isNestedDuplicate] of nestedIdentifiers) {
          if (nestedId !== 'default') addIdentifier(nestedId, isNestedDuplicate);
        }
      }
    }
  }

  setCachedExportedIdentifiers(graph, filePath, identifiers);
  return identifiers;
};

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
  for (const ref of importsForExport.refs) {
    if (ref.startsWith(`${identifier}.`)) return false;
  }
  return true;
};

export const getIssueType = (hasOnlyNsReference: boolean, isType: boolean) => {
  if (hasOnlyNsReference) return isType ? 'nsTypes' : 'nsExports';
  return isType ? 'types' : 'exports';
};

export const findImportRef = (
  graph: ModuleGraph,
  importingFile: string,
  importedFile: string,
  identifier: string
): Import | undefined => {
  const node = graph.get(importingFile);
  if (!node) return undefined;
  for (const _import of node.imports.imports) {
    if (_import.filePath === importedFile && _import.identifier === identifier) return _import;
  }
};
