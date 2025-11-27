import type { FileNode, Identifier, ModuleGraph } from '../../types/module-graph.js';
import { CONTINUE } from '../constants.js';
import { walkDown } from '../walk-down.js';

/** @public */
export interface TreeNode {
  filePath: string;
  identifier: string;
  hasRef: boolean;
  isEntry: boolean;
  children: TreeNode[];
}

export const buildExportsTree = (
  graph: ModuleGraph,
  entryPaths: Set<string>,
  options: { filePath?: string; identifier?: Identifier }
) => {
  const traces: TreeNode[] = [];

  const processFile = (filePath: string, file: FileNode) => {
    for (const exportId of options.identifier ? [options.identifier] : file.exports.keys()) {
      if (!options.identifier || file.exports.has(exportId)) {
        const trace = buildExportTree(graph, entryPaths, filePath, exportId);
        if (trace) traces.push(trace);
      }
    }
  };

  if (options.filePath) {
    const file = graph.get(options.filePath);
    if (file) processFile(options.filePath, file);
  } else {
    for (const [filePath, file] of graph) processFile(filePath, file);
  }

  return traces;
};

const buildExportTree = (
  graph: ModuleGraph,
  entryPaths: Set<string>,
  filePath: string,
  identifier: string
): TreeNode => {
  const rootNode: TreeNode = {
    filePath,
    identifier,
    hasRef: false,
    isEntry: entryPaths.has(filePath),
    children: [],
  };

  const nodeMap = new Map<string, TreeNode>();
  nodeMap.set(`${filePath}:${identifier}`, rootNode);

  walkDown(
    graph,
    filePath,
    identifier,
    (sourceFile, sourceId, importingFile, id, isEntry, isReExport) => {
      const key = `${importingFile}:${id}`;
      const childNode = nodeMap.get(key) ?? {
        filePath: importingFile,
        identifier: id,
        hasRef: !isReExport && Boolean(graph.get(importingFile)?.traceRefs?.has(id)),
        isEntry,
        children: [],
      };
      nodeMap.set(key, childNode);

      const parentKey = `${sourceFile}:${sourceId}`;
      const parentNode = nodeMap.get(parentKey) ?? rootNode;
      parentNode.children.push(childNode);

      return CONTINUE;
    },
    entryPaths
  );

  return rootNode;
};
