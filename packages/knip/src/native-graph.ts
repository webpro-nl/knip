import { createRequire } from 'node:module';
import type { GraphExplorer } from './graph-explorer/explorer.ts';
import type { NativeFileCompact } from './native-analyzer-wire.ts';
import type { IdToFileMap, IdToNsToFileMap, ModuleGraph } from './types/module-graph.ts';

export type GraphUsage = Pick<GraphExplorer, 'isReferenced' | 'hasStrictlyNsReferences' | 'isEnumerated'>;

interface NativeUsageGraph {
  isReferenced: (
    filePath: string,
    identifier: string,
    traverseEntries: boolean,
    treatStarAtEntryAsReferenced: boolean
  ) => { referenced: boolean; entryPath?: string; reExportedIds?: string[] };
  hasStrictlyNsReferences: (filePath: string, identifier: string) => { referenced: boolean; namespace?: string };
  isEnumerated: (filePath: string, identifier: string) => boolean;
}

interface NativeBinding {
  NativeUsageGraph: new (strings: string[], data: Uint32Array) => NativeUsageGraph;
  NativeProjectGraph: new () => NativeProjectBinding;
}

interface NativeProjectBinding extends NativeUsageGraph {
  addFile(filePath: string, strings: string[], data: Uint32Array, hasDefaultExport: boolean): string[];
  finalize(entryPaths: string[]): void;
  hasImporters(filePath: string): boolean;
  hasReference(filePath: string, identifier: string): boolean;
  hasStrictlyEnumReferences(filePath: string, identifier: string): boolean;
}

const require = createRequire(import.meta.url);
const projectGraphs = new WeakMap<ModuleGraph, NativeProjectGraph>();

export const getNativeProjectGraph = (graph: ModuleGraph) => projectGraphs.get(graph);
export const setNativeProjectGraph = (graph: ModuleGraph, project: NativeProjectGraph) =>
  projectGraphs.set(graph, project);

export class NativeProjectGraph {
  private native: NativeProjectBinding;
  readonly usage: GraphUsage;

  constructor() {
    const binding: NativeBinding = require('knip/native');
    this.native = new binding.NativeProjectGraph();
    this.usage = adaptUsage(this.native);
  }

  addFile(filePath: string, file: NativeFileCompact, hasDefaultExport: boolean) {
    return this.native.addFile(filePath, file.strings, file.data, hasDefaultExport);
  }

  finalize(entryPaths: Set<string>) {
    this.native.finalize([...entryPaths]);
  }

  hasImporters(filePath: string) {
    return this.native.hasImporters(filePath);
  }

  hasReference(filePath: string, identifier: string) {
    return this.native.hasReference(filePath, identifier);
  }

  hasStrictlyEnumReferences(filePath: string, identifier: string) {
    return this.native.hasStrictlyEnumReferences(filePath, identifier);
  }
}

const createSnapshot = (graph: ModuleGraph, entryPaths: Set<string>) => {
  const strings: string[] = [];
  const indices = new Map<string, number>();
  const data: number[] = [];
  const intern = (value: string) => {
    let index = indices.get(value);
    if (index === undefined) {
      index = strings.length;
      strings.push(value);
      indices.set(value, index);
    }
    return index;
  };
  const writeSet = (values: Set<string>) => {
    data.push(values.size);
    for (const value of values) data.push(intern(value));
  };
  const writeSources = (map: IdToFileMap) => {
    data.push(map.size);
    for (const [id, sources] of map) {
      data.push(intern(id));
      writeSet(sources);
    }
  };
  const writeAliases = (map: IdToNsToFileMap) => {
    data.push(map.size);
    for (const [id, aliases] of map) {
      data.push(intern(id));
      writeSources(aliases);
    }
  };
  writeSet(entryPaths);
  data.push(graph.size);
  for (const [path, node] of graph) {
    const imports = node.importedBy;
    data.push(intern(path), (node.skipExports ? 1 : 0) | (node.exports.has('default') ? 2 : 0) | (imports ? 4 : 0));
    if (!imports) continue;
    writeSet(imports.refs);
    data.push(imports.enumerated ? imports.enumerated.size + 1 : 0);
    if (imports.enumerated) for (const id of imports.enumerated) data.push(intern(id));
    writeSources(imports.import);
    writeAliases(imports.importAs);
    writeSources(imports.importNs);
    writeSources(imports.reExport);
    writeAliases(imports.reExportAs);
    writeSources(imports.reExportNs);
  }
  return { strings, data: Uint32Array.from(data) };
};

export const createNativeGraphUsage = (graph: ModuleGraph, entryPaths: Set<string>): GraphUsage => {
  const binding: NativeBinding = require('knip/native');
  const { strings, data } = createSnapshot(graph, entryPaths);
  const native = new binding.NativeUsageGraph(strings, data);
  return adaptUsage(native);
};

const adaptUsage = (native: NativeUsageGraph): GraphUsage => {
  return {
    isReferenced: (filePath, identifier, options) => {
      const result = native.isReferenced(
        filePath,
        identifier,
        options.traverseEntries,
        options.treatStarAtEntryAsReferenced ?? false
      );
      return [
        result.referenced,
        result.entryPath ?? undefined,
        result.reExportedIds === undefined ? undefined : new Set(result.reExportedIds),
      ];
    },
    hasStrictlyNsReferences: (filePath, identifier) => {
      const result = native.hasStrictlyNsReferences(filePath, identifier);
      return result.namespace === undefined ? [result.referenced] : [result.referenced, result.namespace];
    },
    isEnumerated: (filePath, identifier) => native.isEnumerated(filePath, identifier),
  };
};
