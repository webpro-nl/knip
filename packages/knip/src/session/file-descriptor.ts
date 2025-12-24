import { createGraphExplorer } from '../graph-explorer/explorer.js';
import type { ModuleGraph } from '../types/module-graph.js';
import { toAbsolute } from '../util/path.js';
import { buildExportsMap, buildImportLookup, buildInternalImports } from './build-maps.js';
import type { ContentionDetails, File, FileMetrics } from './types.js';

export interface FileDescriptorOptions {
  isShowContention?: boolean;
}

export const buildFileDescriptor = (
  filePath: string,
  cwd: string,
  graph: ModuleGraph,
  entryPaths: Set<string>,
  options: FileDescriptorOptions = {}
): File | undefined => {
  const absolutePath = toAbsolute(filePath, cwd);

  const node = graph.get(absolutePath);
  if (!node) return;

  const explorer = createGraphExplorer(graph, entryPaths);

  const metrics: FileMetrics = { imports: 0, exports: 0, cycles: 0, contention: 0 };

  let t0 = performance.now();
  const importLookup = buildImportLookup(node);
  const internalImports = buildInternalImports(node, explorer, importLookup);
  metrics.imports = performance.now() - t0;

  t0 = performance.now();
  const exportsMap = buildExportsMap(node, absolutePath, graph, entryPaths, explorer, importLookup);
  const exports = Array.from(exportsMap.values()).sort(
    (a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.col ?? 0) - (b.col ?? 0)
  );
  metrics.exports = performance.now() - t0;

  t0 = performance.now();
  const cycles = explorer.findCycles(absolutePath);
  metrics.cycles = performance.now() - t0;

  t0 = performance.now();
  const contention: Record<string, ContentionDetails> = Object.create(null);
  if (options.isShowContention !== false) {
    const contentionMap = explorer.getContention(absolutePath);
    for (const identifier of exportsMap.keys()) {
      const details = contentionMap.get(identifier);
      if (!details) continue;
      if (details.branching.length === 0 && details.conflict.length === 0) continue;
      contention[identifier] = details;
    }
  }
  metrics.contention = performance.now() - t0;

  return {
    internalImports,
    exports,
    cycles,
    contention,
    metrics,
  };
};
