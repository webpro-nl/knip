import type { ModuleGraph } from '../types/module-graph.ts';
import { invalidateCache as invalidateCacheInternal } from './cache.ts';
import { buildExportsTree } from './operations/build-exports-tree.ts';
import { findAllCycles } from './operations/find-all-cycles.ts';
import { findCycles } from './operations/find-cycles.ts';
import { getContention } from './operations/get-contention.ts';
import { getDependencyUsage } from './operations/get-dependency-usage.ts';
import { getUsage } from './operations/get-usage.ts';
import { hasStrictlyNsReferences } from './operations/has-strictly-ns-references.ts';
import { isReferenced } from './operations/is-referenced.ts';
import { resolveDefinition } from './operations/resolve-definition.ts';

export const createGraphExplorer = (graph: ModuleGraph, entryPaths: Set<string>) => {
  return {
    /**
     * Is exported `identifier` imported/referenced in the module graph?
     * @returns `[isReferenced, reExportingEntryFile]` → [is export used, entry path reached through re-exports]
     */
    isReferenced: (
      filePath: string,
      identifier: string,
      options: { traverseEntries: boolean; treatStarAtEntryAsReferenced?: boolean }
    ) => isReferenced(graph, entryPaths, filePath, identifier, options),
    hasStrictlyNsReferences: (filePath: string, identifier: string) =>
      hasStrictlyNsReferences(graph, filePath, graph.get(filePath)?.importedBy, identifier),
    buildExportsTree: (options: { filePath?: string; identifier?: string }) =>
      buildExportsTree(graph, entryPaths, options),
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
