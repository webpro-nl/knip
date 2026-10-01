import type { Cycle } from '../../session/types.ts';
import type { ModuleGraph } from '../../types/module-graph.ts';
import { getRuntimeSuccessors } from '../utils.ts';

export const findCycles = (graph: ModuleGraph, filePath: string, maxDepth = 16) => {
  const cycles: Cycle[] = [];
  const visited = new Set<string>();
  const pathSet = new Set<string>([filePath]);
  const path: string[] = [filePath];

  const visit = (currentPath: string) => {
    if (path.length > maxDepth) return;
    const node = graph.get(currentPath);
    if (!node) return;

    for (const importedPath of getRuntimeSuccessors(node)) {
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
