import type { ModuleGraph } from '../../types/module-graph.ts';
import { createExportOriginResolver } from './resolve-export-origins.ts';

export interface AmbiguousStarExport {
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

  const origins = [];
  for (const origin of resolution.origins) {
    origins.push({ filePath: origin.filePath, identifier: origin.identifier });
  }
  return { origins };
};
