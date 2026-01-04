import type { ImportMaps, ModuleGraph } from '../../types/module-graph.js';
import { getAliasReExportMap, getPassThroughReExportSources, getStarReExportSources } from '../visitors.js';

export const hasStrictlyNsReferences = (
  graph: ModuleGraph,
  filePath: string,
  importsForExport: ImportMaps | undefined,
  identifier: string,
  seenFiles = new Set<string>()
): [boolean, string?] => {
  if (!importsForExport) return [false];

  if (seenFiles.has(filePath)) return [false];
  seenFiles.add(filePath);

  let namespace: string | undefined;

  const followReExports = (sources: Set<string>, nextId: string): [boolean, string?] | undefined => {
    for (const filePath of sources) {
      const file = graph.get(filePath);
      if (!file?.importedBy) continue;
      const result = hasStrictlyNsReferences(graph, filePath, file.importedBy, nextId, seenFiles);
      if (result[0] === false && result[1]) return result;
      if (result[1] && !namespace) namespace = result[1];
    }
    return undefined;
  };

  for (const ns of importsForExport.importNs.keys()) {
    const hasNsRef = importsForExport.refs.has(ns);
    if (!hasNsRef) return [false, ns];

    for (const ref of importsForExport.refs) {
      if (ref.startsWith(`${ns}.`)) return [false, ns];
    }

    namespace = ns;

    const nsAliases = getAliasReExportMap(importsForExport, ns);
    if (nsAliases) {
      for (const [alias, sources] of nsAliases) {
        const result = followReExports(sources, alias);
        if (result) return result;
      }
    }
  }

  const directSources = getPassThroughReExportSources(importsForExport, identifier);
  if (directSources) {
    const result = followReExports(directSources, identifier);
    if (result) return result;
  }

  const starSources = getStarReExportSources(importsForExport);
  if (starSources) {
    const result = followReExports(starSources, identifier);
    if (result) return result;
  }

  const [id, ...rest] = identifier.split('.');
  const aliasEntries = getAliasReExportMap(importsForExport, id);
  if (aliasEntries) {
    for (const [alias, sources] of aliasEntries) {
      const result = followReExports(sources, [alias, ...rest].join('.'));
      if (result) return result;
    }
  }

  for (const [ns, sources] of importsForExport.reExportNs) {
    const result = followReExports(sources, `${ns}.${identifier}`);
    if (result) return result;
  }

  const importedSources = importsForExport.import.get(identifier);
  if (importedSources) {
    const result = followReExports(importedSources, identifier);
    if (result) return result;
  }

  const importAsMap = importsForExport.importAs.get(identifier);
  if (importAsMap) {
    for (const [alias, sources] of importAsMap) {
      const result = followReExports(sources, alias);
      if (result) return result;
    }
  }

  if (namespace) return [true, namespace];
  return [false];
};
