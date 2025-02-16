import { IMPORT_STAR } from '../constants.js';
import type { ImportDetails, ModuleGraph } from '../types/module-graph.js';

export const hasStrictlyEnumReferences = (importsForExport: ImportDetails | undefined, id: string) => {
  if (!importsForExport || !importsForExport.refs.has(id)) return false;
  for (const ref of importsForExport.refs) if (ref.startsWith(`${id}.`)) return false;
  return true;
};

export const hasStrictlyNsReferences = (
  graph: ModuleGraph,
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
          const hasStrictlyNsRefs = hasStrictlyNsReferences(graph, file.imported, id);
          if (hasStrictlyNsRefs[0] === false) return hasStrictlyNsRefs;
        }
      }
    }

    const reExportedAs = importsForExport.reExportedAs.get(ns);
    if (reExportedAs) {
      for (const byFilePaths of reExportedAs.values()) {
        for (const filePath of byFilePaths) {
          const file = graph.get(filePath);
          if (file?.imported) {
            const hasStrictlyNsRefs = hasStrictlyNsReferences(graph, file.imported, id);
            if (hasStrictlyNsRefs[0] === false) return hasStrictlyNsRefs;
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
        const hasStrictlyNsRefs = hasStrictlyNsReferences(graph, file.imported, id);
        if (hasStrictlyNsRefs[0] === false) return hasStrictlyNsRefs;
        namespace = hasStrictlyNsRefs[1];
      }
    }
  }

  {
    const byFilePaths = importsForExport.reExported.get(IMPORT_STAR);
    if (byFilePaths) {
      for (const filePath of byFilePaths) {
        const file = graph.get(filePath);
        if (file?.imported) {
          const hasStrictlyNsRefs = hasStrictlyNsReferences(graph, file.imported, id);
          if (hasStrictlyNsRefs[0] === false) return hasStrictlyNsRefs;
          namespace = hasStrictlyNsRefs[1];
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
          const hasStrictlyNsRefs = hasStrictlyNsReferences(graph, file.imported, [alias, ...rest].join('.'));
          if (hasStrictlyNsRefs[0] === false) return hasStrictlyNsRefs;
          namespace = hasStrictlyNsRefs[1];
        }
      }
    }
  }

  for (const [ns, filePaths] of importsForExport.reExportedNs.entries()) {
    for (const filePath of filePaths) {
      const file = graph.get(filePath);
      if (file?.imported) {
        const hasStrictlyNsRefs = hasStrictlyNsReferences(graph, file.imported, `${ns}.${id}`);
        if (hasStrictlyNsRefs[0] === false) return hasStrictlyNsRefs;
        namespace = hasStrictlyNsRefs[1];
      }
    }
  }

  if (namespace) return [true, namespace];
  return [false];
};

export const getType = (hasOnlyNsReference: boolean, isType: boolean) =>
  hasOnlyNsReference ? (isType ? 'nsTypes' : 'nsExports') : isType ? 'types' : 'exports';
