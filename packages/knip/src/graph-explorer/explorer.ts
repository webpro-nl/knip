import type { ModuleGraph } from '../types/module-graph.ts';
import { getTopologyGeneration, invalidateCache as invalidateCacheInternal } from './cache.ts';
import { buildExportsTree } from './operations/build-exports-tree.ts';
import { findAllCycles } from './operations/find-all-cycles.ts';
import { findCycles } from './operations/find-cycles.ts';
import { getContention } from './operations/get-contention.ts';
import { getDependencyUsage } from './operations/get-dependency-usage.ts';
import { getUsage } from './operations/get-usage.ts';
import { hasStrictlyNsReferences } from './operations/has-strictly-ns-references.ts';
import { isEnumerated } from './operations/is-enumerated.ts';
import { isReferenced } from './operations/is-referenced.ts';
import { resolveDefinition } from './operations/resolve-definition.ts';
import { resolveExportOrigins } from './operations/resolve-export-origins.ts';

export const createGraphExplorer = (graph: ModuleGraph, entryPaths: Set<string>, cacheUsage = false) => {
  const references = new Map<string, Map<string, ReturnType<typeof isReferenced>>>();
  let generation = getTopologyGeneration(graph);
  const reference = (filePath: string, identifier: string, options: Parameters<typeof isReferenced>[4]) => {
    if (!cacheUsage) return isReferenced(graph, entryPaths, filePath, identifier, options);
    const current = getTopologyGeneration(graph);
    if (current !== generation) {
      references.clear();
      generation = current;
    }
    let file = references.get(filePath);
    if (!file) references.set(filePath, (file = new Map()));
    const key = `${options.traverseEntries ? 1 : 0}${options.treatStarAtEntryAsReferenced ? 1 : 0}:${identifier}`;
    const cached = file.get(key);
    if (cached) return cached;
    const result = isReferenced(graph, entryPaths, filePath, identifier, options);
    file.set(key, result);
    return result;
  };
  return {
    /**
     * Is exported `identifier` imported/referenced in the module graph?
     * @returns `[isReferenced, reExportingEntryFile, reExportedIds]` → [is export used, entry path reached through re-exports, ids at that entry]
     */
    isReferenced: reference,
    hasStrictlyNsReferences: (filePath: string, identifier: string) =>
      hasStrictlyNsReferences(graph, filePath, graph.get(filePath)?.importedBy, identifier),
    isEnumerated: (filePath: string, identifier: string) =>
      isEnumerated(graph, filePath, graph.get(filePath)?.importedBy, identifier),
    buildExportsTree: (options: { filePath?: string; identifier?: string }) =>
      buildExportsTree(graph, entryPaths, options),
    /**
     * Which bindings does exported `identifier` resolve to?
     * @returns `{ origins, hasExplicitExport }` → [defining module + local binding, explicit export beats `export *`]
     */
    resolveExportOrigins: (filePath: string, identifier: string) => resolveExportOrigins(graph, filePath, identifier),
    getDependencyUsage: (pattern?: string | RegExp) => getDependencyUsage(graph, pattern),
    resolveDefinition: (filePath: string, identifier: string) => resolveDefinition(graph, filePath, identifier),
    getUsage: (filePath: string, identifier: string) => getUsage(graph, entryPaths, filePath, identifier),
    findCycles: (filePath: string, maxDepth?: number) => findCycles(graph, filePath, maxDepth),
    findAllCycles: (ignoredFlags?: number) => findAllCycles(graph, ignoredFlags),
    getContention: (filePath: string) => getContention(graph, filePath),
    invalidateCache: () => invalidateCacheInternal(graph),
  };
};

export type GraphExplorer = ReturnType<typeof createGraphExplorer>;
