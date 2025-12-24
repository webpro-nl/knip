import type { ModuleGraph } from '../types/module-graph.js';
import { invalidateCache as invalidateCacheInternal } from './cache.js';
import { buildExportsTree } from './operations/build-exports-tree.js';
import { findCycles } from './operations/find-cycles.js';
import { getContention } from './operations/get-contention.js';
import { getDependencyUsage } from './operations/get-dependency-usage.js';
import { getUsage } from './operations/get-usage.js';
import { hasStrictlyNsReferences } from './operations/has-strictly-ns-references.js';
import { isReferenced } from './operations/is-referenced.js';
import { resolveDefinition } from './operations/resolve-definition.js';

export const createGraphExplorer = (graph: ModuleGraph, entryPaths: Set<string>) => {
  return {
    /**
     * Is exported `identifier` imported/referenced in the module graph?
     * @returns `[isReferenced, reExportingEntryFile]` → [is export used, entry path if traversing through re-exports]
     */
    isReferenced: (filePath: string, identifier: string, options: { includeEntryExports: boolean }) =>
      isReferenced(graph, entryPaths, filePath, identifier, options),
    hasStrictlyNsReferences: (filePath: string, identifier: string) =>
      hasStrictlyNsReferences(graph, graph.get(filePath)?.imported, identifier),
    buildExportsTree: (options: { filePath?: string; identifier?: string }) =>
      buildExportsTree(graph, entryPaths, options),
    getDependencyUsage: (pattern?: string | RegExp) => getDependencyUsage(graph, pattern),
    resolveDefinition: (filePath: string, identifier: string) => resolveDefinition(graph, filePath, identifier),
    getUsage: (filePath: string, identifier: string) => getUsage(graph, entryPaths, filePath, identifier),
    findCycles: (filePath: string, maxDepth?: number) => findCycles(graph, filePath, maxDepth),
    getContention: (filePath: string) => getContention(graph, filePath),
    invalidateCache: () => invalidateCacheInternal(graph),
  };
};

export type GraphExplorer = ReturnType<typeof createGraphExplorer>;
