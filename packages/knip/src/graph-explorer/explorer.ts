import type { ModuleGraph } from '../types/module-graph.js';
import { buildExportsTree } from './operations/build-exports-tree.js';
import { hasStrictlyNsReferences } from './operations/has-strictly-ns-references.js';
import { isReferenced } from './operations/is-referenced.js';

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
  };
};
