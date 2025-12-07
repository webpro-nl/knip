import type { FileNode, Identifier, ImportMaps, ModuleGraph } from '../../types/module-graph.js';
import { CONTINUE } from '../constants.js';
import type { Via } from '../walk-down.js';
import { walkDown } from '../walk-down.js';

/** @internal */
export interface TreeNode {
  filePath: string;
  identifier: string;
  originalId: string | undefined;
  via: Via | undefined;
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

  const rootNode: TreeNode = {
    filePath,
    identifier,
    refs: filterRefs(file?.imported?.refs, identifier),
    isEntry: entryPaths.has(filePath),
    children: [],
    originalId: undefined,
    via: undefined,
  };

  const nodeMap = new Map<string, TreeNode>();
  nodeMap.set(`${filePath}:${identifier}`, rootNode);

  walkDown(
    graph,
    filePath,
    identifier,
    (sourceFile, sourceId, importingFile, id, isEntry, via) => {
      const importMaps = graph.get(importingFile)?.imports.internal.get(sourceFile);
      const importRefs = importMaps?.refs;
      const ns = id.split('.')[0];
      if (via === 'importNS' && !hasRelevantRef(importRefs, id) && !isNsReExported(importMaps, ns)) return CONTINUE;
      const key = `${importingFile}:${id}`;
      const isRenamed = via.endsWith('As') && sourceId !== ns;
      const refs = filterRefs(importRefs, id);
      const childNode = nodeMap.get(key) ?? {
        filePath: importingFile,
        identifier: id,
        originalId: isRenamed ? sourceId : undefined,
        via,
        refs,
        isEntry,
        children: [],
      };
      nodeMap.set(key, childNode);
      let parentNode = nodeMap.get(`${sourceFile}:${sourceId}`);
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

  pruneReExportStarOnlyBranches(rootNode);

  return rootNode;
};

const filterRefs = (refs: Set<string> | undefined, id: string): string[] => {
  if (!refs) return [];
  return Array.from(refs).filter(ref => id === ref || id.startsWith(`${ref}.`) || ref.startsWith(`${id}.`));
};

const hasRelevantRef = (refs: Set<string> | undefined, id: string): boolean => {
  if (!refs || refs.size === 0) return false;
  return Array.from(refs).some(ref => ref === id || ref.startsWith(`${id}.`));
};

const isNsReExported = (importMaps: ImportMaps | undefined, ns: string): boolean => {
  if (!importMaps) return false;
  return importMaps.reExportedAs.has(ns) || importMaps.reExportedNs.has(ns);
};

const hasNonReExportStar = (node: TreeNode): boolean => {
  if (node.via && node.via !== 'reExportStar') return true;
  return node.children.some(child => hasNonReExportStar(child));
};

const pruneReExportStarOnlyBranches = (node: TreeNode): void => {
  node.children = node.children.filter(child => hasNonReExportStar(child));
  for (const child of node.children) pruneReExportStarOnlyBranches(child);
};
