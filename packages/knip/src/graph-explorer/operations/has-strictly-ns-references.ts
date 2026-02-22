import type { ImportMaps, ModuleGraph } from '../../types/module-graph.ts';
import { getAliasReExportMap, getPassThroughReExportSources, getStarReExportSources } from '../visitors.ts';

export const hasStrictlyNsReferences = (
  graph: ModuleGraph,
  filePath: string,
  importsForExport: ImportMaps | undefined,
  identifier: string
): [boolean, string?] => {
  const seen = new Set<string>();

  const walkDown = (path: string, importMaps: ImportMaps | undefined, id: string): [boolean, string?] => {
    if (!importMaps) return [false];

    if (seen.has(path)) return [false];
    seen.add(path);

    let namespace: string | undefined;

    const follow = (sources: Set<string>, nextId: string): [boolean, string?] | undefined => {
      for (const filePath of sources) {
        const file = graph.get(filePath);
        if (!file?.importedBy) continue;
        const result = walkDown(filePath, file.importedBy, nextId);
        if (result[0] === false && result[1]) return result;
        if (result[1] && !namespace) namespace = result[1];
      }
      return undefined;
    };

    for (const ns of importMaps.importNs.keys()) {
      if (!importMaps.refs.has(ns)) return [false, ns];

      for (const ref of importMaps.refs) {
        if (ref.startsWith(`${ns}.`)) return [false, ns];
      }

      namespace = ns;

      const nsAliases = getAliasReExportMap(importMaps, ns);
      if (nsAliases) {
        for (const [alias, sources] of nsAliases) {
          const result = follow(sources, alias);
          if (result) return result;
        }
      }
    }

    const directSources = getPassThroughReExportSources(importMaps, id);
    if (directSources) {
      const result = follow(directSources, id);
      if (result) return result;
    }

    const starSources = getStarReExportSources(importMaps);
    if (starSources) {
      const result = follow(starSources, id);
      if (result) return result;
    }

    const [_id, ...rest] = id.split('.');
    const aliasEntries = getAliasReExportMap(importMaps, _id);
    if (aliasEntries) {
      for (const [alias, sources] of aliasEntries) {
        const result = follow(sources, [alias, ...rest].join('.'));
        if (result) return result;
      }
    }

    for (const [ns, sources] of importMaps.reExportNs) {
      const result = follow(sources, `${ns}.${id}`);
      if (result) return result;
    }

    const importedSources = importMaps.import.get(id);
    if (importedSources) {
      const result = follow(importedSources, id);
      if (result) return result;
    }

    const importAsMap = importMaps.importAs.get(id);
    if (importAsMap) {
      for (const [alias, sources] of importAsMap) {
        const result = follow(sources, alias);
        if (result) return result;
      }
    }

    if (namespace) return [true, namespace];
    return [false];
  };

  return walkDown(filePath, importsForExport, identifier);
};
