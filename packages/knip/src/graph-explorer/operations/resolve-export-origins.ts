import { IMPORT_STAR, SYMBOL_TYPE } from '../../constants.ts';
import type { FileNode, ModuleGraph } from '../../types/module-graph.ts';
import {
  forEachAliasReExport,
  getNamespaceReExportSources,
  getPassThroughReExportSources,
  getStarReExportSources,
} from '../visitors.ts';

export type ExportNamespace = 'type' | 'value';

export interface ExportOrigin {
  filePath: string;
  identifier: string;
  namespaces: ExportNamespace[];
}

export interface ExportOriginResolution {
  origins: ExportOrigin[];
  hasExplicitExport: boolean;
}

const getNamespaces = (type: string, isTypeOnly: boolean): ExportNamespace[] => {
  if (isTypeOnly || type === SYMBOL_TYPE.TYPE || type === SYMBOL_TYPE.INTERFACE) return ['type'];
  if (type === SYMBOL_TYPE.CLASS || type === SYMBOL_TYPE.ENUM || type === SYMBOL_TYPE.NAMESPACE)
    return ['type', 'value'];
  return ['value'];
};

const isTypeOnlyEdge = (node: FileNode, sourcePath: string, identifier: string) => {
  let isMatch = false;
  let isTypeOnly = true;
  for (const item of node.imports.imports) {
    if (item.filePath !== sourcePath || item.identifier !== identifier) continue;
    isMatch = true;
    isTypeOnly &&= item.isTypeOnly;
  }
  return isMatch && isTypeOnly;
};

export const createExportOriginResolver = (graph: ModuleGraph) => {
  const cache = new Map<string, ExportOriginResolution>();

  const resolve = (
    filePath: string,
    identifier: string,
    isTypeOnly = false,
    seen = new Set<string>()
  ): ExportOriginResolution => {
    const key = `${filePath}:${identifier}:${isTypeOnly}`;
    const isRoot = seen.size === 0;
    const cached = isRoot ? cache.get(key) : undefined;
    if (cached) return cached;
    if (seen.has(key)) return { origins: [], hasExplicitExport: false };
    seen.add(key);

    const node = graph.get(filePath);
    if (!node) return { origins: [], hasExplicitExport: false };

    const origins = new Map<string, ExportOrigin>();
    const addOrigin = (origin: ExportOrigin, typeOnly = isTypeOnly) => {
      const namespaces: ExportNamespace[] = typeOnly ? ['type'] : origin.namespaces;
      const originKey = `${origin.filePath}:${origin.identifier}`;
      const existing = origins.get(originKey);
      if (!existing) {
        origins.set(originKey, { ...origin, namespaces: [...namespaces] });
        return;
      }
      for (const namespace of namespaces)
        if (!existing.namespaces.includes(namespace)) existing.namespaces.push(namespace);
    };
    const addResolution = (resolution: ExportOriginResolution, typeOnly = isTypeOnly) => {
      for (const origin of resolution.origins) addOrigin(origin, typeOnly);
    };
    const exp = node.exports.get(identifier);
    let hasExplicitExport = !!exp;

    for (const [sourcePath, imports] of node.imports.internal) {
      if (!getNamespaceReExportSources(imports, identifier)) continue;
      hasExplicitExport = true;
      addOrigin({
        filePath: sourcePath,
        identifier: IMPORT_STAR,
        namespaces: isTypeOnlyEdge(node, sourcePath, identifier) ? ['type'] : ['type', 'value'],
      });
    }

    if (exp) {
      if (exp.isBindingReExport) {
        for (const [sourcePath, imports] of node.imports.internal) {
          if (getPassThroughReExportSources(imports, identifier)) {
            addResolution(
              resolve(
                sourcePath,
                identifier,
                isTypeOnly || isTypeOnlyEdge(node, sourcePath, identifier),
                seen
              )
            );
          }
          forEachAliasReExport(imports, (sourceId, alias) => {
            if (alias !== identifier) return;
            addResolution(
              resolve(
                sourcePath,
                sourceId,
                isTypeOnly || isTypeOnlyEdge(node, sourcePath, sourceId),
                seen
              )
            );
          });
        }
      }
      if (origins.size === 0 && !exp.isBindingReExport) {
        addOrigin({ filePath, identifier: exp.binding, namespaces: getNamespaces(exp.type, isTypeOnly) });
      }
    }

    if (hasExplicitExport) {
      const resolution = { origins: [...origins.values()], hasExplicitExport };
      if (isRoot) cache.set(key, resolution);
      return resolution;
    }

    if (identifier !== 'default') {
      for (const [sourcePath, imports] of node.imports.internal) {
        if (!getStarReExportSources(imports)) continue;
        addResolution(
          resolve(
            sourcePath,
            identifier,
            isTypeOnly || isTypeOnlyEdge(node, sourcePath, IMPORT_STAR),
            seen
          )
        );
      }
    }

    const resolution = { origins: [...origins.values()], hasExplicitExport };
    if (isRoot) cache.set(key, resolution);
    return resolution;
  };

  return (filePath: string, identifier: string) => resolve(filePath, identifier);
};
