import type { FileNode, Identifier, ModuleGraph } from '../../types/module-graph.js';
import { CONTINUE } from '../constants.js';
import type { Via } from '../walk-down.js';
import { walkDown } from '../walk-down.js';

/** @public */
export interface TreeNode {
  filePath: string;
  identifier: string;
  originalName?: string;
  via?: Via;
  refs: string[];
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
  const file = graph.get(filePath);

  const filterRefs = (refs: Set<string> | undefined, id: string): string[] => {
    if (!refs) return [];
    return Array.from(refs).filter(ref => id === ref || id.startsWith(`${ref}.`) || ref.startsWith(`${id}.`));
  };

  const rootNode: TreeNode = {
    filePath,
    identifier,
    refs: filterRefs(file?.imported?.refs, identifier),
    isEntry: entryPaths.has(filePath),
    children: [],
  };

  const nodeMap = new Map<string, TreeNode>();
  nodeMap.set(`${filePath}:${identifier}`, rootNode);

  walkDown(
    graph,
    filePath,
    identifier,
    (sourceFile, sourceId, importingFile, id, isEntry, via) => {
      const key = `${importingFile}:${id}`;
      const importRefs = graph.get(importingFile)?.imports.internal.get(sourceFile)?.refs;
      const isRenamed = via.endsWith('As') && sourceId !== id.split('.')[0];
      const childNode = nodeMap.get(key) ?? {
        filePath: importingFile,
        identifier: id,
        originalName: isRenamed ? sourceId : undefined,
        via,
        refs: filterRefs(importRefs, id),
        isEntry,
        children: [],
      };
      nodeMap.set(key, childNode);

      const parentKey = `${sourceFile}:${sourceId}`;
      let parentNode = nodeMap.get(parentKey);
      if (!parentNode) {
        for (const [k, v] of nodeMap) {
          if (k.startsWith(`${sourceFile}:${sourceId}.`) || k === `${sourceFile}:${sourceId}`) {
            parentNode = v;
            break;
          }
        }
      }
      (parentNode ?? rootNode).children.push(childNode);

      return CONTINUE;
    },
    entryPaths
  );

  return rootNode;
};
