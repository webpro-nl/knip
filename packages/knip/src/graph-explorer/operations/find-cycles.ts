import type { Cycle } from '../../session/types.js';
import type { ModuleGraph } from '../../types/module-graph.js';

export const findCycles = (graph: ModuleGraph, filePath: string, maxDepth = 16) => {
  const cycles: Cycle[] = [];
  const visited = new Set<string>();
  const pathSet = new Set<string>([filePath]);
  const path: string[] = [filePath];

  const visit = (currentPath: string) => {
    if (path.length > maxDepth) return;
    const node = graph.get(currentPath);
    if (!node?.imports?.internal) return;

    const nonTypeOnlyImports = new Set<string>();
    for (const _import of node.imports.imports) {
      if (_import.filePath && !_import.isTypeOnly) nonTypeOnlyImports.add(_import.filePath);
    }

    for (const [importedPath] of node.imports.internal) {
      if (!nonTypeOnlyImports.has(importedPath)) continue;

      if (importedPath === filePath) {
        cycles.push([...path, importedPath]);
        continue;
      }
      if (visited.has(importedPath)) continue;
      if (!pathSet.has(importedPath)) {
        path.push(importedPath);
        pathSet.add(importedPath);
        visit(importedPath);
        pathSet.delete(importedPath);
        path.pop();
      }
    }
    visited.add(currentPath);
  };

  visit(filePath);

  return cycles;
};
