import { IMPORT_STAR } from '../constants.js';
import type { DependencyGraph, ImportDetails } from '../types/dependency-graph.js';

export const getHasStrictlyNsReferences = (
  graph: DependencyGraph,
  importsForExport: ImportDetails | undefined,
  id: string
): [boolean, string?] => {
  if (!importsForExport) return [false];

  let namespace: string | undefined;

  for (const ns of importsForExport.importedNs.keys()) {
    const hasNs = importsForExport.refs.has(ns);
    if (!hasNs) return [false, ns];
    for (const id of importsForExport.refs) if (id.startsWith(`${ns}.`)) return [false, ns];

    const byFilePaths = importsForExport.reExportedNs.get(ns);
    if (byFilePaths) {
      for (const filePath of byFilePaths) {
        const file = graph.get(filePath);
        if (file?.imported) {
          const hasStrictlyNsReferences = getHasStrictlyNsReferences(graph, file.imported, id);
          if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
        }
      }
    }

    const reExportedAs = importsForExport.reExportedAs.get(ns);
    if (reExportedAs) {
      for (const byFilePaths of reExportedAs.values()) {
        for (const filePath of byFilePaths) {
          const file = graph.get(filePath);
          if (file?.imported) {
            const hasStrictlyNsReferences = getHasStrictlyNsReferences(graph, file.imported, id);
            if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
          }
        }
      }
    }

    namespace = ns;
  }

  const byFilePaths = importsForExport.reExported.get(id);
  if (byFilePaths) {
    for (const filePath of byFilePaths) {
      const file = graph.get(filePath);
      if (file?.imported) {
        const hasStrictlyNsReferences = getHasStrictlyNsReferences(graph, file.imported, id);
        if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
        namespace = hasStrictlyNsReferences[1];
      }
    }
  }

  {
    const byFilePaths = importsForExport.reExported.get(IMPORT_STAR);
    if (byFilePaths) {
      for (const filePath of byFilePaths) {
        const file = graph.get(filePath);
        if (file?.imported) {
          const hasStrictlyNsReferences = getHasStrictlyNsReferences(graph, file.imported, id);
          if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
          namespace = hasStrictlyNsReferences[1];
        }
      }
    }
  }

  const [identifier, ...rest] = id.split('.');
  const reExportedAs = importsForExport.reExportedAs.get(identifier);
  if (reExportedAs) {
    for (const [alias, filePaths] of reExportedAs.entries()) {
      for (const filePath of filePaths) {
        const file = graph.get(filePath);
        if (file?.imported) {
          const hasStrictlyNsReferences = getHasStrictlyNsReferences(graph, file.imported, [alias, ...rest].join('.'));
          if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
          namespace = hasStrictlyNsReferences[1];
        }
      }
    }
  }

  for (const [ns, filePaths] of importsForExport.reExportedNs.entries()) {
    for (const filePath of filePaths) {
      const file = graph.get(filePath);
      if (file?.imported) {
        const hasStrictlyNsReferences = getHasStrictlyNsReferences(graph, file.imported, `${ns}.${id}`);
        if (hasStrictlyNsReferences[0] === false) return hasStrictlyNsReferences;
        namespace = hasStrictlyNsReferences[1];
      }
    }
  }

  if (namespace) return [true, namespace];
  return [false];
};

export const getType = (hasOnlyNsReference: boolean, isType: boolean) =>
  hasOnlyNsReference ? (isType ? 'nsTypes' : 'nsExports') : isType ? 'types' : 'exports';
