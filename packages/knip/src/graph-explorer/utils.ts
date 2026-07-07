import { IMPORT_FLAGS, IMPORT_STAR, OPAQUE, SIDE_EFFECTS } from '../constants.ts';
import type { FileNode, Import, ImportMaps, ModuleGraph } from '../types/module-graph.ts';
import { getCachedExportedIdentifiers, setCachedExportedIdentifiers } from './cache.ts';
import {
  forEachAliasReExport,
  forEachNamespaceReExport,
  forEachPassThroughReExport,
  getStarReExportSources,
} from './visitors.ts';

const IGNORED_CYCLE_IMPORT_FLAGS = IMPORT_FLAGS.ENTRY | IMPORT_FLAGS.DYNAMIC;

export const getIgnoredCycleImportFlags = (includeDynamicImports: boolean) =>
  includeDynamicImports ? IMPORT_FLAGS.ENTRY : IGNORED_CYCLE_IMPORT_FLAGS;

export const getExportedIdentifiers = (
  graph: ModuleGraph,
  filePath: string,
  visited = new Set<string>()
): Map<string, boolean> => {
  if (visited.has(filePath)) return new Map();
  visited.add(filePath);

  const cached = getCachedExportedIdentifiers(graph, filePath);
  if (cached) return cached;

  const node = graph.get(filePath);
  if (!node) return new Map();

  const identifiers = new Map<string, boolean>();

  const addIdentifier = (identifier: string, isDuplicate = false) => {
    if (identifiers.has(identifier)) {
      identifiers.set(identifier, true);
    } else {
      identifiers.set(identifier, isDuplicate);
    }
  };

  for (const identifier of node.exports.keys()) {
    if (identifier === 'default') continue;
    addIdentifier(identifier);
  }

  if (node.imports?.internal) {
    for (const [importedPath, importDetails] of node.imports.internal) {
      forEachPassThroughReExport(importDetails, (id, _sources) => {
        if (id !== 'default') addIdentifier(id);
      });

      forEachAliasReExport(importDetails, (_id, alias, _sources) => {
        addIdentifier(alias);
      });

      forEachNamespaceReExport(importDetails, (namespace, _sources) => {
        addIdentifier(namespace, true);
      });

      const starSources = getStarReExportSources(importDetails);
      if (starSources) {
        const nestedIdentifiers = getExportedIdentifiers(graph, importedPath, new Set(visited));
        for (const [nestedId, isNestedDuplicate] of nestedIdentifiers) {
          if (nestedId !== 'default') addIdentifier(nestedId, isNestedDuplicate);
        }
      }
    }
  }

  setCachedExportedIdentifiers(graph, filePath, identifiers);
  return identifiers;
};

/** Internal modules imported by `node` through at least one runtime import not in `ignoredFlags`. */
export const getRuntimeSuccessors = (node: FileNode, ignoredFlags = IGNORED_CYCLE_IMPORT_FLAGS): Set<string> => {
  const successors = new Set<string>();
  for (const _import of node.imports.imports) {
    if (
      _import.filePath &&
      !_import.isTypeOnly &&
      !(_import.modifiers & ignoredFlags) &&
      node.imports.internal.has(_import.filePath)
    ) {
      successors.add(_import.filePath);
    }
  }
  return successors;
};

const getImportKind = (importMaps: ImportMaps, identifier: string | undefined, modifiers: number) => {
  if (modifiers & IMPORT_FLAGS.DYNAMIC) return 'dynamicImport';
  if (identifier === IMPORT_STAR && importMaps.reExport.has(IMPORT_STAR)) return 'reExportStar';
  if (identifier && importMaps.reExportNs.has(identifier)) return 'reExportNS';
  if (identifier && importMaps.reExportAs.has(identifier)) return 'reExportAs';
  if (identifier && importMaps.reExport.has(identifier)) return 'reExport';
  if (identifier === IMPORT_STAR && importMaps.importNs.size > 0) return 'importNS';
  if (identifier && importMaps.importAs.has(identifier)) return 'importAs';
  if (identifier === OPAQUE) return 'dynamicImport';
  if (identifier === SIDE_EFFECTS) return 'sideEffectImport';
  return 'import';
};

export const getRuntimeImport = (node: FileNode, filePath: string, ignoredFlags = IGNORED_CYCLE_IMPORT_FLAGS) => {
  const importMaps = node.imports.internal.get(filePath);
  if (!importMaps) return;

  let result: Import | undefined;
  for (const _import of node.imports.imports) {
    if (_import.filePath !== filePath || _import.isTypeOnly || _import.modifiers & ignoredFlags) continue;
    if (!result || _import.line < result.line || (_import.line === result.line && _import.col < result.col)) {
      result = _import;
    }
  }

  if (!result) return;
  const { specifier, pos, line, col, identifier, modifiers } = result;
  return { kind: getImportKind(importMaps, identifier, modifiers), specifier, pos, line, col };
};

export const hasStrictlyEnumReferences = (importsForExport: ImportMaps | undefined, identifier: string): boolean => {
  if (!importsForExport || !importsForExport.refs.has(identifier)) return false;
  for (const ref of importsForExport.refs) {
    if (ref.startsWith(`${identifier}.`)) return false;
  }
  return true;
};

export const getIssueType = (hasOnlyNsReference: boolean, isType: boolean) => {
  if (hasOnlyNsReference) return isType ? 'nsTypes' : 'nsExports';
  return isType ? 'types' : 'exports';
};

export const findImportRef = (
  graph: ModuleGraph,
  importingFile: string,
  importedFile: string,
  identifier: string
): Import | undefined => {
  const node = graph.get(importingFile);
  if (!node) return undefined;
  for (const _import of node.imports.imports) {
    if (_import.filePath === importedFile && _import.identifier === identifier) return _import;
  }
};
