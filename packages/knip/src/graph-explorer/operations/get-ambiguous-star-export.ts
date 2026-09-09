import type { ModuleGraph } from '../../types/module-graph.ts';
import { createExportOriginResolver, type ExportNamespace } from './resolve-export-origins.ts';

export interface AmbiguousStarExport {
  namespaces: ExportNamespace[];
  origins: { filePath: string; identifier: string }[];
}

export const getAmbiguousStarExport = (
  graph: ModuleGraph,
  filePath: string,
  identifier: string
): AmbiguousStarExport | undefined => {
  if (identifier === 'default') return;
  const resolution = createExportOriginResolver(graph)(filePath, identifier);
  if (resolution.hasExplicitExport || resolution.origins.length < 2) return;

  const namespaces = new Set<ExportNamespace>();
  const origins = [];
  for (const origin of resolution.origins) {
    for (const namespace of origin.namespaces) namespaces.add(namespace);
    origins.push({ filePath: origin.filePath, identifier: origin.identifier });
  }
  return { namespaces: [...namespaces], origins };
};
