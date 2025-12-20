import type { ModuleGraph } from '../../types/module-graph.js';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.js';

export interface DependencyNode {
  filePath: string;
  specifier: string;
  binaryName: string | undefined;
  pos: number | undefined;
  line: number | undefined;
  col: number | undefined;
}

export interface DependencyNodes {
  packageName: string;
  imports: DependencyNode[];
}

export const getDependencyUsage = (graph: ModuleGraph, pattern?: string | RegExp): Map<string, DependencyNodes> => {
  const result = new Map<string, DependencyNodes>();

  const isMatch = (packageName: string, binaryName?: string) => {
    if (!pattern) return true;
    if (typeof pattern === 'string') return packageName === pattern || binaryName === pattern;
    return pattern.test(packageName) || (binaryName !== undefined && pattern.test(binaryName));
  };

  const addEntry = (
    packageName: string,
    filePath: string,
    specifier: string,
    binaryName: string | undefined,
    pos: number | undefined,
    line: number | undefined,
    col: number | undefined
  ) => {
    let entry = result.get(packageName);
    if (!entry) {
      entry = { packageName, imports: [] };
      result.set(packageName, entry);
    }
    entry.imports.push({ filePath, specifier, binaryName, pos, line, col });
  };

  for (const [filePath, file] of graph) {
    if (file.imports?.external) {
      for (const _import of file.imports.external) {
        const packageName = getPackageNameFromModuleSpecifier(_import.specifier);
        if (packageName && isMatch(packageName)) {
          addEntry(packageName, filePath, _import.specifier, undefined, _import.pos, _import.line, _import.col);
        }
      }
    }

    if (file.imports?.externalRefs) {
      for (const ref of file.imports.externalRefs) {
        const packageName = getPackageNameFromModuleSpecifier(ref.specifier);
        if (packageName && isMatch(packageName, ref.identifier)) {
          addEntry(packageName, filePath, ref.specifier, ref.identifier, undefined, undefined, undefined);
        }
      }
    }
  }

  return result;
};
