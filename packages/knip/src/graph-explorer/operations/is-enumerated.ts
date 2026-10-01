import type { ImportMaps, ModuleGraph } from '../../types/module-graph.ts';
import { getAliasReExportMap, getPassThroughReExportSources, getStarReExportSources } from '../visitors.ts';

export const isEnumerated = (
  graph: ModuleGraph,
  filePath: string,
  importsForExport: ImportMaps | undefined,
  identifier: string
): boolean => {
  const seen = new Set<string>();

  const walkDown = (path: string, importMaps: ImportMaps | undefined, id: string): boolean => {
    if (!importMaps || seen.has(path)) return false;
    seen.add(path);

    if (importMaps.enumerated?.has(id)) return true;

    const follow = (sources: Set<string>, nextId: string): boolean => {
      for (const source of sources) {
        if (walkDown(source, graph.get(source)?.importedBy, nextId)) return true;
      }
      return false;
    };

    const directSources = getPassThroughReExportSources(importMaps, id);
    if (directSources && follow(directSources, id)) return true;

    const starSources = getStarReExportSources(importMaps);
    if (starSources && follow(starSources, id)) return true;

    const aliasMap = getAliasReExportMap(importMaps, id);
    if (aliasMap) {
      for (const [alias, sources] of aliasMap) {
        if (follow(sources, alias)) return true;
      }
    }

    return false;
  };

  return walkDown(filePath, importsForExport, identifier);
};
