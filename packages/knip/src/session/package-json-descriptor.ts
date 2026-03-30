import { createGraphExplorer } from '../graph-explorer/explorer.ts';
import type { DependencyNodes } from '../graph-explorer/operations/get-dependency-usage.ts';
import type { ModuleGraph } from '../types/module-graph.ts';

export interface PackageJsonFile {
  dependenciesUsage: Map<string, DependencyNodes>;
}

export const buildPackageJsonDescriptor = (graph: ModuleGraph, entryPaths: Set<string>): PackageJsonFile => {
  const explorer = createGraphExplorer(graph, entryPaths);

  return {
    dependenciesUsage: explorer.getDependencyUsage(),
  };
};
