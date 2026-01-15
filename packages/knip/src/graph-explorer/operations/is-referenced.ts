import { OPAQUE } from '../../constants.js';
import type { Identifier, ModuleGraph } from '../../types/module-graph.js';
import {
  getAliasReExportMap,
  getNamespaceReExportSources,
  getPassThroughReExportSources,
  getStarReExportSources,
} from '../visitors.js';

export const isReferenced = (
  graph: ModuleGraph,
  entryPaths: Set<string>,
  filePath: string,
  id: Identifier,
  options: { includeEntryExports: boolean }
) => {
  const seen = new Set<string>();

  const walkDown = (path: string, id: string): [boolean, string | undefined] => {
    const isEntryFile = entryPaths.has(path);
    let reExportingEntryFile: string | undefined = isEntryFile ? path : undefined;

    if (seen.has(path)) return [false, reExportingEntryFile];
    seen.add(path);

    const restIds = id.split('.');
    const identifier = restIds.shift();
    const file = graph.get(path)?.importedBy;

    if (!identifier || !file) {
      return [false, reExportingEntryFile];
    }

    const follow = (sources: Set<string>, nextId: string): boolean => {
      for (const byFilePath of sources) {
        if (seen.has(byFilePath)) continue;
        const result = walkDown(byFilePath, nextId);
        if (result[1]) reExportingEntryFile = result[1];
        if (result[0]) return true;
      }
      return false;
    };

    if (
      file.import.get(OPAQUE) ||
      ((identifier === id || (identifier !== id && file.refs.has(id))) &&
        (file.import.has(identifier) || file.importAs.has(identifier)))
    ) {
      return [true, reExportingEntryFile];
    }

    for (const [exportId, aliases] of file.importAs) {
      if (identifier === exportId) {
        for (const alias of aliases.keys()) {
          const aliasedRef = [alias, ...restIds].join('.');
          if (file.refs.has(aliasedRef)) {
            return [true, reExportingEntryFile];
          }
        }
      }
    }

    for (const namespace of file.importNs.keys()) {
      if (file.refs.has(`${namespace}.${id}`)) {
        return [true, reExportingEntryFile];
      }

      const nsAliasMap = getAliasReExportMap(file, namespace);
      if (nsAliasMap) {
        for (const [alias, sources] of nsAliasMap) {
          if (follow(sources, `${alias}.${id}`)) return [true, reExportingEntryFile];
        }
      }

      const nsReExportSources = getNamespaceReExportSources(file, namespace);
      if (nsReExportSources) {
        if (follow(nsReExportSources, `${namespace}.${id}`)) return [true, reExportingEntryFile];
      }
    }

    if (isEntryFile && !options.includeEntryExports) return [false, reExportingEntryFile];

    const aliasMap = getAliasReExportMap(file, identifier);
    if (aliasMap) {
      for (const [alias, sources] of aliasMap) {
        if (follow(sources, [alias, ...restIds].join('.'))) return [true, reExportingEntryFile];
      }
    }

    const directSources = getPassThroughReExportSources(file, identifier);
    const starSources = getStarReExportSources(file);

    if (directSources) {
      if (follow(directSources, id)) return [true, reExportingEntryFile];
    } else if (starSources) {
      if (follow(starSources, id)) return [true, reExportingEntryFile];
    }

    for (const [namespace, sources] of file.reExportNs) {
      if (follow(sources, `${namespace}.${id}`)) {
        return [true, reExportingEntryFile];
      }
    }

    return [false, reExportingEntryFile];
  };

  return walkDown(filePath, id);
};
