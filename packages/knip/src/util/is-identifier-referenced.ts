import { IMPORT_STAR } from '../constants.js';
import type { ModuleGraph } from '../types/module-graph.js';
import { type TraceNode, addNodes, createNode, isTrace } from './trace.js';

type Result = {
  isReferenced: boolean;
  reExportingEntryFile: undefined | string;
  traceNode: TraceNode;
};

export const getIsIdentifierReferencedHandler = (graph: ModuleGraph, entryPaths: Set<string>) => {
  const isIdentifierReferenced = (
    filePath: string,
    id: string,
    isIncludeEntryExports = false,
    traceNode = createNode(filePath),
    seen = new Set<string>()
  ): Result => {
    let isReferenced = false;
    let reExportingEntryFile = entryPaths.has(filePath) ? filePath : undefined;

    if (reExportingEntryFile) traceNode.isEntry = true;

    if (!isIncludeEntryExports && reExportingEntryFile) return { isReferenced, reExportingEntryFile, traceNode };

    seen.add(filePath);

    const ids = id.split('.');
    const [identifier, ...rest] = ids;

    const file = graph.get(filePath)?.imported;

    if (!file) return { isReferenced, reExportingEntryFile, traceNode };

    if (
      ((identifier !== id && file.refs.has(id)) || identifier === id) &&
      (file.imported.has(identifier) || file.importedAs.has(identifier))
    ) {
      isReferenced = true;
      if (!isTrace) return { isReferenced, reExportingEntryFile, traceNode };
      if (file.importedAs.has(identifier)) {
        for (const aliases of file.importedAs.values()) {
          for (const alias of aliases.keys()) addNodes(traceNode, alias, graph, aliases.get(alias));
        }
      } else addNodes(traceNode, id, graph, file.imported.get(identifier));
    }

    for (const [exportId, aliases] of file.importedAs.entries()) {
      if (identifier === exportId) {
        for (const alias of aliases.keys()) {
          const aliasedRef = [alias, ...rest].join('.');
          if (file.refs.has(aliasedRef)) {
            isReferenced = true;
            if (!isTrace) {
              return { isReferenced, reExportingEntryFile, traceNode };
            }
            addNodes(traceNode, aliasedRef, graph, aliases.get(alias));
          }
        }
      }
    }

    for (const [namespace, byFilePaths] of file.importedNs) {
      if (file.refs.has(`${namespace}.${id}`)) {
        isReferenced = true;
        if (!isTrace) return { isReferenced, reExportingEntryFile, traceNode };
        addNodes(traceNode, `${namespace}.${id}`, graph, byFilePaths);
      }

      const reExportedAs = file.reExportedAs.get(namespace);

      if (reExportedAs) {
        for (const [alias, byFilePaths] of reExportedAs) {
          for (const byFilePath of byFilePaths) {
            if (!seen.has(byFilePath)) {
              const child = createNode(byFilePath);
              traceNode.children.add(child);
              const result = isIdentifierReferenced(byFilePath, `${alias}.${id}`, isIncludeEntryExports, child, seen);
              if (result.reExportingEntryFile) reExportingEntryFile = result.reExportingEntryFile;
              if (result.isReferenced) {
                isReferenced = true;
                if (!isTrace) return { isReferenced, reExportingEntryFile, traceNode };
              }
            }
          }
        }
      }

      const reExportedNs = file.reExportedNs.get(namespace);

      if (reExportedNs) {
        for (const byFilePath of reExportedNs) {
          if (!seen.has(byFilePath)) {
            const child = createNode(byFilePath);
            traceNode.children.add(child);
            const result = isIdentifierReferenced(byFilePath, `${namespace}.${id}`, isIncludeEntryExports, child, seen);
            if (result.reExportingEntryFile) reExportingEntryFile = result.reExportingEntryFile;
            if (result.isReferenced) {
              isReferenced = true;
              if (!isTrace) return { isReferenced, reExportingEntryFile, traceNode };
            }
          }
        }
      }
    }

    const reExported = file.reExported.get(identifier) ?? file.reExported.get(IMPORT_STAR);

    if (reExported) {
      for (const byFilePath of reExported) {
        if (!seen.has(byFilePath)) {
          const child = createNode(byFilePath);
          traceNode.children.add(child);
          const result = isIdentifierReferenced(byFilePath, id, isIncludeEntryExports, child, seen);
          if (result.reExportingEntryFile) reExportingEntryFile = result.reExportingEntryFile;
          if (result.isReferenced) {
            isReferenced = true;
            if (!isTrace) return { isReferenced, reExportingEntryFile, traceNode };
          }
        }
      }
    }

    const reExportedAs = file.reExportedAs.get(identifier);

    if (reExportedAs) {
      for (const [alias, byFilePaths] of reExportedAs) {
        for (const byFilePath of byFilePaths) {
          if (!seen.has(byFilePath)) {
            const child = createNode(byFilePath);
            traceNode.children.add(child);
            const ref = [alias, ...rest].join('.');
            const result = isIdentifierReferenced(byFilePath, ref, isIncludeEntryExports, child, seen);
            if (result.reExportingEntryFile) reExportingEntryFile = result.reExportingEntryFile;
            if (result.isReferenced) {
              isReferenced = true;
              if (!isTrace) return { isReferenced, reExportingEntryFile, traceNode };
            }
          }
        }
      }
    }

    for (const [namespace, byFilePaths] of file.reExportedNs.entries()) {
      for (const byFilePath of byFilePaths) {
        if (!seen.has(byFilePath)) {
          const child = createNode(byFilePath);
          traceNode.children.add(child);
          const result = isIdentifierReferenced(byFilePath, `${namespace}.${id}`, isIncludeEntryExports, child, seen);
          if (result.reExportingEntryFile) reExportingEntryFile = result.reExportingEntryFile;
          if (result.isReferenced) {
            isReferenced = true;
            if (!isTrace) return { isReferenced, reExportingEntryFile, traceNode };
          }
        }
      }
    }

    return { isReferenced, reExportingEntryFile, traceNode };
  };

  return isIdentifierReferenced;
};
