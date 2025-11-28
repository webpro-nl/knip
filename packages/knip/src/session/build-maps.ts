import { IMPORT_STAR } from '../constants.js';
import type { GraphExplorer } from '../graph-explorer/explorer.js';
import { getExportedIdentifiers } from '../graph-explorer/utils.js';
import {
  forEachAliasReExport,
  forEachNamespaceReExport,
  forEachPassThroughReExport,
  getStarReExportSources,
} from '../graph-explorer/visitors.js';
import type { FileNode, ModuleGraph } from '../types/module-graph.js';
import type { Export, ImportLookup, InternalImport } from './types.js';

const FALLBACK_LOCATION = { identifier: undefined, pos: 0, line: 0, col: 0 };

export const buildImportLookup = (fileNode: FileNode) => {
  const imports: ImportLookup = new Map();

  for (const _import of fileNode.imports.imports) {
    if (!_import.filePath || !_import.identifier) continue;
    let fileMap = imports.get(_import.filePath);
    if (!fileMap) {
      fileMap = new Map();
      imports.set(_import.filePath, fileMap);
    }
    const list = fileMap.get(_import.identifier) ?? [];
    list.push(_import);
    fileMap.set(_import.identifier, list);
  }

  return imports;
};

export const buildExportsMap = (
  fileNode: FileNode,
  filePath: string,
  graph: ModuleGraph,
  entryPaths: Set<string>,
  explorer: GraphExplorer,
  importLookup: ImportLookup
) => {
  const exportsMap = new Map<string, Export>();
  const getImport = (importedFilePath: string, id: string) =>
    importLookup.get(importedFilePath)?.get(id)?.[0] ?? FALLBACK_LOCATION;

  const addExport = (
    identifier: string,
    sourceFilePath: string,
    pos: number,
    line: number,
    col: number,
    childExports: Export[] | undefined
  ) => {
    if (exportsMap.has(identifier)) return;
    const usage = explorer.getUsage(sourceFilePath, identifier);
    const usageEntryPaths = new Set<string>();
    for (const location of usage.locations) if (location.isEntry) usageEntryPaths.add(location.filePath);
    if (entryPaths.has(sourceFilePath)) usageEntryPaths.add(sourceFilePath);

    exportsMap.set(identifier, {
      filePath,
      identifier,
      pos,
      line,
      col,
      importLocations: usage.locations.filter((loc: { isReExport: boolean }) => !loc.isReExport),
      entryPaths: usageEntryPaths,
      exports: childExports,
    });
  };

  for (const _export of fileNode.exports.values()) {
    addExport(_export.identifier, filePath, _export.pos, _export.line, _export.col, undefined);
  }

  for (const [importedFilePath, importMaps] of fileNode.imports.internal) {
    forEachPassThroughReExport(importMaps, (id, _sources) => {
      if (exportsMap.has(id)) return;
      const directImport = getImport(importedFilePath, id);
      addExport(id, filePath, directImport.pos, directImport.line, directImport.col, undefined);
    });

    forEachAliasReExport(importMaps, (id, alias, _sources) => {
      if (exportsMap.has(alias)) return;
      const aliasImport = getImport(importedFilePath, id);
      addExport(alias, filePath, aliasImport.pos, aliasImport.line, aliasImport.col, undefined);
    });

    forEachNamespaceReExport(importMaps, (namespace, _sources) => {
      if (exportsMap.has(namespace)) return;
      const namespaceImport = getImport(importedFilePath, namespace) ?? getImport(importedFilePath, IMPORT_STAR);
      const childExports: Export[] = [];
      const exportedIdentifiers = getExportedIdentifiers(graph, importedFilePath);
      for (const identifier of exportedIdentifiers.keys()) {
        const usage = explorer.getUsage(importedFilePath, identifier);
        const usageEntryPaths = new Set<string>();
        for (const location of usage.locations) if (location.isEntry) usageEntryPaths.add(location.filePath);
        if (entryPaths.has(importedFilePath)) usageEntryPaths.add(importedFilePath);

        childExports.push({
          filePath,
          identifier,
          pos: namespaceImport.pos,
          line: namespaceImport.line,
          col: namespaceImport.col,
          importLocations: usage.locations,
          entryPaths: usageEntryPaths,
          exports: undefined,
        });
      }

      addExport(namespace, filePath, namespaceImport.pos, namespaceImport.line, namespaceImport.col, childExports);
    });

    const starSources = getStarReExportSources(importMaps);
    if (starSources) {
      const starImport = getImport(importedFilePath, IMPORT_STAR);
      const exportedIdentifiers = getExportedIdentifiers(graph, importedFilePath);
      for (const [nestedIdentifier] of exportedIdentifiers) {
        if (nestedIdentifier === 'default') continue;
        addExport(nestedIdentifier, importedFilePath, starImport.pos, starImport.line, starImport.col, undefined);
      }
    }
  }

  return exportsMap;
};

export const buildInternalImports = (fileNode: FileNode, explorer: GraphExplorer, importLookup: ImportLookup) => {
  const getImport = (importedFilePath: string, id: string) =>
    importLookup.get(importedFilePath)?.get(id)?.[0] ?? FALLBACK_LOCATION;
  const internalImports: InternalImport[] = [];

  const addInternalImport = (
    importedFilePath: string,
    identifier: string,
    alias = identifier,
    importLine: number,
    importCol: number
  ) => {
    const resolution = explorer.resolveDefinition(importedFilePath, identifier);
    const location =
      resolution?.type === 'symbol' && resolution.exportNode
        ? {
            filePath: resolution.filePath,
            pos: resolution.exportNode.pos,
            line: resolution.exportNode.line,
            col: resolution.exportNode.col,
          }
        : { filePath: importedFilePath, pos: 0, line: 0, col: 0 };

    internalImports.push({
      identifier: alias,
      filePath: location.filePath,
      pos: location.pos,
      line: location.line,
      col: location.col,
      importLine,
      importCol,
    });
  };

  for (const [importedFilePath, importMaps] of fileNode.imports.internal) {
    for (const identifier of importMaps.imported.keys()) {
      const _import = getImport(importedFilePath, identifier);
      addInternalImport(importedFilePath, identifier, _import.identifier, _import.line, _import.col);
    }

    for (const [identifier, aliasMap] of importMaps.importedAs) {
      for (const [alias] of aliasMap) {
        const _import = getImport(importedFilePath, identifier);
        addInternalImport(importedFilePath, identifier, alias, _import.line, _import.col);
      }
    }

    if (importMaps.importedNs.size > 0) {
      const _import = getImport(importedFilePath, IMPORT_STAR);
      for (const namespace of importMaps.importedNs.keys()) {
        addInternalImport(importedFilePath, namespace, namespace, _import.line, _import.col);
      }
    }
  }

  internalImports.sort((a, b) => a.importLine - b.importLine || a.importCol - b.importCol);

  return internalImports;
};
