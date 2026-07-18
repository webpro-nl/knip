import { OPAQUE } from '../../constants.ts';
import type { Identifier, ImportMaps, ModuleGraph } from '../../types/module-graph.ts';
import {
  getAliasReExportMap,
  getNamespaceReExportSources,
  getPassThroughReExportSources,
  getStarReExportSources,
} from '../visitors.ts';

const hasOnlyNsRefs = (file: ImportMaps): boolean => {
  if (file.importNs.size === 0) return false;
  for (const ns of file.importNs.keys()) {
    if (!file.refs.has(ns)) return false;
    for (const ref of file.refs) {
      if (ref.startsWith(`${ns}.`)) return false;
    }
  }
  return true;
};

export const isReferenced = (
  graph: ModuleGraph,
  entryPaths: Set<string>,
  filePath: string,
  id: Identifier,
  options: { traverseEntries: boolean; treatStarAtEntryAsReferenced?: boolean }
) => {
  const seen = new Set<string>();
  let isReferenced = false;
  let reExportingEntryFile: string | undefined;

  const hasCompleteResult = () => isReferenced && (options.traverseEntries || reExportingEntryFile !== undefined);

  const walkDown = (path: string, id: string, viaStar = false): boolean => {
    const isEntryFile = entryPaths.has(path);
    if (isEntryFile && !reExportingEntryFile) reExportingEntryFile = path;
    if (hasCompleteResult()) return true;

    if (seen.has(path)) return false;
    seen.add(path);

    const restIds = id.split('.');
    const identifier = restIds.shift();

    if (options.treatStarAtEntryAsReferenced && isEntryFile && viaStar && restIds.length > 0) {
      isReferenced = true;
      return hasCompleteResult();
    }

    const file = graph.get(path)?.importedBy;

    if (!identifier || !file) {
      return false;
    }

    const follow = (sources: Set<string>, nextId: string, nextViaStar = viaStar): boolean => {
      for (const byFilePath of sources) {
        if (walkDown(byFilePath, nextId, nextViaStar)) return true;
      }
      return false;
    };

    if (!isReferenced) {
      const hasDirectReference =
        (file.import.get(OPAQUE) && !hasOnlyNsRefs(file)) ||
        ((identifier === id || (identifier !== id && file.refs.has(id))) &&
          (file.import.has(identifier) || file.importAs.has(identifier)));
      if (hasDirectReference) {
        isReferenced = true;
        if (hasCompleteResult()) return true;
      }
    }

    if (!isReferenced) {
      aliasImports: for (const [exportId, aliases] of file.importAs) {
        if (identifier === exportId) {
          for (const alias of aliases.keys()) {
            const aliasedRef = [alias, ...restIds].join('.');
            if (file.refs.has(aliasedRef)) {
              isReferenced = true;
              break aliasImports;
            }
          }
        }
      }
      if (hasCompleteResult()) return true;
    }

    for (const namespace of file.importNs.keys()) {
      if (!isReferenced && file.refs.has(`${namespace}.${id}`)) {
        isReferenced = true;
        if (hasCompleteResult()) return true;
      }

      const nsAliasMap = getAliasReExportMap(file, namespace);
      if (nsAliasMap) {
        for (const [alias, sources] of nsAliasMap) {
          if (follow(sources, `${alias}.${id}`)) return true;
        }
      }

      const nsReExportSources = getNamespaceReExportSources(file, namespace);
      if (nsReExportSources) {
        if (follow(nsReExportSources, `${namespace}.${id}`)) return true;
      }
    }

    if (isEntryFile && !options.traverseEntries) return false;

    const aliasMap = getAliasReExportMap(file, identifier);
    if (aliasMap) {
      for (const [alias, sources] of aliasMap) {
        if (follow(sources, [alias, ...restIds].join('.'))) return true;
      }
    }

    const directSources = getPassThroughReExportSources(file, identifier);
    const starSources = getStarReExportSources(file);

    if (directSources) {
      if (follow(directSources, id)) return true;
    } else if (starSources) {
      if (follow(starSources, id, true)) return true;
    }

    for (const [namespace, sources] of file.reExportNs) {
      if (follow(sources, `${namespace}.${id}`, true)) return true;
    }

    return false;
  };

  walkDown(filePath, id);
  return [isReferenced, reExportingEntryFile] as const;
};
