import { IMPORT_STAR } from '../../constants.ts';
import type { ModuleGraph } from '../../types/module-graph.ts';
import {
  forEachAliasReExport,
  getNamespaceReExportSources,
  getPassThroughReExportSources,
  getStarReExportSources,
} from '../visitors.ts';

export interface ExportOrigin {
  filePath: string;
  identifier: string;
}

export interface ExportOriginResolution {
  origins: ExportOrigin[];
  hasExplicitExport: boolean;
}

export const createExportOriginResolver = (graph: ModuleGraph) => {
  const cache = new Map<string, ExportOriginResolution>();

  const resolve = (filePath: string, identifier: string, seen = new Set<string>()): ExportOriginResolution => {
    const key = `${filePath}:${identifier}`;
    const isRoot = seen.size === 0;
    const cached = isRoot ? cache.get(key) : undefined;
    if (cached) return cached;
    if (seen.has(key)) return { origins: [], hasExplicitExport: false };
    seen.add(key);

    const node = graph.get(filePath);
    if (!node) return { origins: [], hasExplicitExport: false };

    const origins = new Map<string, ExportOrigin>();
    const addOrigin = (origin: ExportOrigin) => {
      const originKey = `${origin.filePath}:${origin.identifier}`;
      if (!origins.has(originKey)) origins.set(originKey, origin);
    };
    const addResolution = (resolution: ExportOriginResolution) => {
      for (const origin of resolution.origins) addOrigin(origin);
    };
    const exp = node.exports.get(identifier);
    let hasExplicitExport = !!exp;

    for (const [sourcePath, imports] of node.imports.internal) {
      if (exp && !exp.isBindingReExport) continue;
      if (!getNamespaceReExportSources(imports, identifier)) continue;
      hasExplicitExport = true;
      addOrigin({ filePath: sourcePath, identifier: IMPORT_STAR });
    }

    if (exp) {
      if (exp.isBindingReExport) {
        for (const [sourcePath, imports] of node.imports.internal) {
          if (getPassThroughReExportSources(imports, identifier)) {
            addResolution(resolve(sourcePath, identifier, seen));
          }
          forEachAliasReExport(imports, (sourceId, alias) => {
            if (alias !== identifier) return;
            addResolution(resolve(sourcePath, sourceId, seen));
          });
        }
      }
      if (origins.size === 0 && !exp.isBindingReExport) {
        addOrigin({ filePath, identifier: exp.binding });
      }
    }

    if (hasExplicitExport) {
      const resolution = { origins: [...origins.values()], hasExplicitExport };
      if (isRoot) cache.set(key, resolution);
      return resolution;
    }

    if (identifier !== 'default') {
      for (const [sourcePath, imports] of node.imports.internal) {
        if (!getStarReExportSources(imports)) continue;
        addResolution(resolve(sourcePath, identifier, seen));
      }
    }

    const resolution = { origins: [...origins.values()], hasExplicitExport };
    if (isRoot) cache.set(key, resolution);
    return resolution;
  };

  return (filePath: string, identifier: string) => resolve(filePath, identifier);
};
