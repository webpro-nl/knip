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

  const check = (currentPath: string, currentId: string): [boolean, string | undefined] => {
    const isEntryFile = entryPaths.has(currentPath);
    let reExportingEntryFile: string | undefined = isEntryFile ? currentPath : undefined;

    if (isEntryFile && !options.includeEntryExports) return [false, reExportingEntryFile];

    if (seen.has(currentPath)) return [false, reExportingEntryFile];
    seen.add(currentPath);

    const restIds = currentId.split('.');
    const identifier = restIds.shift();
    const file = graph.get(currentPath)?.imported;

    if (!identifier || !file) {
      return [false, reExportingEntryFile];
    }

    const directSources = getPassThroughReExportSources(file, identifier);
    const starSources = getStarReExportSources(file);

    const followSources = (sources: Set<string>, nextId: string): boolean => {
      for (const byFilePath of sources) {
        if (seen.has(byFilePath)) continue;
        const result = check(byFilePath, nextId);
        if (result[1]) reExportingEntryFile = result[1];
        if (result[0]) return true;
      }
      return false;
    };

    if (
      file.imported.get(OPAQUE) ||
      ((identifier === currentId || (identifier !== currentId && file.refs.has(currentId))) &&
        (file.imported.has(identifier) || file.importedAs.has(identifier)))
    ) {
      return [true, reExportingEntryFile];
    }

    for (const [exportId, aliases] of file.importedAs) {
      if (identifier === exportId) {
        for (const alias of aliases.keys()) {
          const aliasedRef = [alias, ...restIds].join('.');
          if (file.refs.has(aliasedRef)) {
            return [true, reExportingEntryFile];
          }
        }
      }
    }

    for (const namespace of file.importedNs.keys()) {
      if (file.refs.has(`${namespace}.${currentId}`)) {
        return [true, reExportingEntryFile];
      }

      const nsAliasMap = getAliasReExportMap(file, namespace);
      if (nsAliasMap) {
        for (const [alias, sources] of nsAliasMap) {
          if (followSources(sources, `${alias}.${currentId}`)) return [true, reExportingEntryFile];
        }
      }

      const nsReExportSources = getNamespaceReExportSources(file, namespace);
      if (nsReExportSources) {
        if (followSources(nsReExportSources, `${namespace}.${currentId}`)) return [true, reExportingEntryFile];
      }
    }

    const aliasMap = getAliasReExportMap(file, identifier);
    if (aliasMap) {
      for (const [alias, sources] of aliasMap) {
        const ref = [alias, ...restIds].join('.');
        if (followSources(sources, ref)) return [true, reExportingEntryFile];
      }
    }

    if (directSources) {
      if (followSources(directSources, currentId)) return [true, reExportingEntryFile];
    } else if (starSources) {
      if (followSources(starSources, currentId)) return [true, reExportingEntryFile];
    }

    for (const [namespace, sources] of file.reExportedNs) {
      if (followSources(sources, `${namespace}.${currentId}`)) {
        return [true, reExportingEntryFile];
      }
    }

    return [false, reExportingEntryFile];
  };

  return check(filePath, id);
};
