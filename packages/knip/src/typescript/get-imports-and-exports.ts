import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { ALIAS_TAG, ANONYMOUS, DEFAULT_EXTENSIONS, IMPORT_STAR } from '../constants.js';
import type { Tags } from '../types/cli.js';
import type { ExportMap, ExportMember, ImportMap, UnresolvedImport } from '../types/dependency-graph.js';
import type { ExportNode, ExportNodeMember } from '../types/exports.js';
import type { ImportNode } from '../types/imports.js';
import type { IssueSymbol } from '../types/issues.js';
import { timerify } from '../util/Performance.js';
import { addNsValue, addValue, createImports } from '../util/dependency-graph.js';
import { getPackageNameFromFilePath, isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.js';
import { extname, isInNodeModules } from '../util/path.js';
import { shouldIgnore } from '../util/tag.js';
import type { BoundSourceFile } from './SourceFile.js';
import {
  getAccessMembers,
  getDestructuredIds,
  getJSDocTags,
  getLineAndCharacterOfPosition,
  getTypeName,
  isAccessExpression,
  isConsiderReferencedNS,
  isDestructuring,
  isImportSpecifier,
  isReferencedInExportedType,
  isTypeDeclaration,
} from './ast-helpers.js';
import { findInternalReferences } from './find-internal-references.js';
import getDynamicImportVisitors from './visitors/dynamic-imports/index.js';
import getExportVisitors from './visitors/exports/index.js';
import { getImportsFromPragmas } from './visitors/helpers.js';
import getImportVisitors from './visitors/imports/index.js';
import getScriptVisitors from './visitors/scripts/index.js';

const getVisitors = (sourceFile: ts.SourceFile) => ({
  export: getExportVisitors(sourceFile),
  import: getImportVisitors(sourceFile),
  dynamicImport: getDynamicImportVisitors(sourceFile),
  script: getScriptVisitors(sourceFile),
});

const createMember = (node: ts.Node, member: ExportNodeMember, pos: number): ExportMember => {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
  return {
    // @ts-expect-error ref will be unset later
    symbol: member.node.symbol,
    identifier: member.identifier,
    type: member.type,
    pos: member.pos,
    line: line + 1,
    col: character + 1,
    fix: member.fix,
    refs: [0, false],
    jsDocTags: getJSDocTags(member.node),
  };
};

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  skipExports: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  isReportClassMembers: boolean;
  ignoreExportsUsedInFile: boolean;
  tags: Tags;
};

interface AddInternalImportOptions extends ImportNode {
  namespace?: string;
  identifier: string;
  filePath: string;
  isReExport: boolean;
}

const getImportsAndExports = (
  sourceFile: BoundSourceFile,
  resolveModule: (specifier: string) => ts.ResolvedModuleFull | undefined,
  typeChecker: ts.TypeChecker,
  options: GetImportsAndExportsOptions
) => {
  const { skipTypeOnly, tags, ignoreExportsUsedInFile } = options;
  const internalImports: ImportMap = new Map();
  const externalImports = new Set<string>();
  const unresolvedImports = new Set<UnresolvedImport>();
  const resolved = new Set<string>();
  const specifiers = new Set<[string, string]>();
  const exports: ExportMap = new Map();
  const aliasedExports = new Map<string, IssueSymbol[]>();
  const scripts = new Set<string>();
  const traceRefs = new Set<string>();

  const importedInternalSymbols = new Map<ts.Symbol, string>();

  const referencedSymbolsInExportedTypes = new Set<ts.Symbol>();

  const visitors = getVisitors(sourceFile);

  const addInternalImport = (options: AddInternalImportOptions) => {
    const { identifier, symbol, filePath, namespace, alias, specifier, isReExport } = options;

    const isStar = identifier === IMPORT_STAR;

    specifiers.add([specifier, filePath]);

    const file = internalImports.get(filePath);

    const imports = file ?? createImports();

    if (!file) internalImports.set(filePath, imports);

    const nsOrAlias = symbol ? String(symbol.escapedName) : alias;

    if (isReExport) {
      if (isStar && namespace) {
        // Pattern: export * as NS from 'specifier';
        addValue(imports.reExportedNs, namespace, sourceFile.fileName);
      } else if (nsOrAlias) {
        // Pattern: export { id as alias } from 'specifier';
        addNsValue(imports.reExportedAs, identifier, nsOrAlias, sourceFile.fileName);
      } else {
        // Patterns:
        // export { id } from 'specifier';
        // export * from 'specifier';
        // module.exports = require('specifier');
        addValue(imports.reExported, identifier, sourceFile.fileName);
      }
    } else {
      if (nsOrAlias && nsOrAlias !== identifier) {
        if (isStar) {
          addValue(imports.importedNs, nsOrAlias, sourceFile.fileName);
        } else {
          addNsValue(imports.importedAs, identifier, nsOrAlias, sourceFile.fileName);
        }
      } else if (identifier !== ANONYMOUS && identifier !== IMPORT_STAR) {
        addValue(imports.imported, identifier, sourceFile.fileName);
      }

      if (symbol && DEFAULT_EXTENSIONS.includes(extname(sourceFile.fileName))) {
        importedInternalSymbols.set(symbol, filePath);
      }
    }
  };

  const addImport = (options: ImportNode, node: ts.Node) => {
    const { specifier, isTypeOnly, pos, identifier = ANONYMOUS, isReExport = false } = options;
    if (isBuiltin(specifier)) return;

    const module = resolveModule(specifier);

    if (module) {
      const filePath = module.resolvedFileName;
      if (filePath) {
        if (options.resolve && !isInNodeModules(filePath)) {
          resolved.add(filePath);
          return;
        }

        if (!module.isExternalLibraryImport || !isInNodeModules(filePath)) {
          addInternalImport({ ...options, identifier, filePath, isReExport });
        }

        if (module.isExternalLibraryImport) {
          if (skipTypeOnly && isTypeOnly) return;

          const sanitizedSpecifier = sanitizeSpecifier(
            isInNodeModules(specifier) || isInNodeModules(filePath) ? getPackageNameFromFilePath(specifier) : specifier
          );

          if (!isStartsLikePackageName(sanitizedSpecifier)) {
            // Import maps and other exceptions, examples from tests: #dep, #internals/used, $app/stores
            return;
          }

          // Module resolver may return DTS references or unaliased npm package names,
          // but in the rest of the program we want the package name based on the original specifier.
          externalImports.add(sanitizedSpecifier);
        }
      }
    } else {
      if (skipTypeOnly && isTypeOnly) return;
      if (shouldIgnore(getJSDocTags(node), tags)) return;

      if (typeof pos === 'number') {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
        unresolvedImports.add({ specifier, pos, line: line + 1, col: character + 1 });
      } else {
        unresolvedImports.add({ specifier });
      }
    }
  };

  const maybeAddAccessExpressionAsNsImport = (namespace: string, member: string | string[]) => {
    const symbol = sourceFile.locals?.get(namespace);
    if (symbol) {
      const importedSymbolFilePath = importedInternalSymbols.get(symbol);
      if (importedSymbolFilePath) {
        const internalImport = internalImports.get(importedSymbolFilePath);
        if (internalImport) {
          if (typeof member === 'string') {
            internalImport.refs.add(`${namespace}.${member}`);
            traceRefs.add(`${namespace}.${member}`);
          } else {
            for (const m of member) {
              internalImport.refs.add(`${namespace}.${m}`);
              traceRefs.add(`${namespace}.${m}`);
            }
          }
        }
      }
    }
  };

  const addExport = ({ node, symbol, identifier, type, pos, members = [], fix }: ExportNode) => {
    if (options.skipExports) return;

    if (symbol) {
      const importedSymbolFilePath = importedInternalSymbols.get(symbol);
      if (importedSymbolFilePath) {
        const importId = String(symbol.escapedName);
        const internalImport = internalImports.get(importedSymbolFilePath);
        if (internalImport) {
          if (importId !== identifier) {
            // Pattern: import { id as alias } from 'specifier'; export = id; export default id;
            // Pattern: import * as NS from 'specifier'; export { NS as aliased }
            addNsValue(internalImport.reExportedAs, importId, identifier, sourceFile.fileName);
          } else if (symbol.declarations && ts.isNamespaceImport(symbol.declarations[0])) {
            // Pattern: import * as NS from 'specifier'; export { NS };
            addValue(internalImport.reExportedNs, identifier, sourceFile.fileName);
          } else {
            // Pattern: import { id } from 'specifier'; export { id };
            addValue(internalImport.reExported, importId, sourceFile.fileName);
          }
        }
      }
    }

    const jsDocTags = getJSDocTags(node);

    const exportMembers = members.map(member => createMember(node, member, member.pos));

    const isReExport = Boolean(
      node.parent?.parent && ts.isExportDeclaration(node.parent.parent) && node.parent.parent.moduleSpecifier
    );

    const item = exports.get(identifier);
    if (item) {
      // Code path for fn overloads, simple merge
      const members = [...(item.members ?? []), ...exportMembers];
      const tags = new Set([...(item.jsDocTags ?? []), ...jsDocTags]);
      const fixes = fix ? [...(item.fixes ?? []), fix] : item.fixes;
      exports.set(identifier, { ...item, members, jsDocTags: tags, fixes, isReExport });
    } else {
      const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
      exports.set(identifier, {
        identifier,
        // @ts-expect-error ref will be unset later
        symbol: node.symbol,
        type,
        members: exportMembers,
        jsDocTags,
        pos,
        line: line + 1,
        col: character + 1,
        fixes: fix ? [fix] : [],
        refs: [0, false],
        isReExport,
      });
    }

    if (!jsDocTags.has(ALIAS_TAG)) {
      if (ts.isExportAssignment(node)) maybeAddAliasedExport(node.expression, 'default');
      if (ts.isVariableDeclaration(node)) maybeAddAliasedExport(node.initializer, identifier);
    }
  };

  const addScript = (script: string) => scripts.add(script);

  const maybeAddAliasedExport = (node: ts.Expression | undefined, alias: string) => {
    const identifier = node?.getText();
    if (node && identifier) {
      const symbol = sourceFile.symbol?.exports?.get(identifier);
      if (symbol?.valueDeclaration) {
        if (!aliasedExports.has(identifier)) {
          const pos = getLineAndCharacterOfPosition(symbol.valueDeclaration, symbol.valueDeclaration.pos);
          aliasedExports.set(identifier, [{ symbol: identifier, ...pos }]);
        }
        const aliasedExport = aliasedExports.get(identifier);
        if (aliasedExport) {
          const pos = getLineAndCharacterOfPosition(node, node.pos);
          aliasedExport.push({ symbol: alias, ...pos });
        }
      }
    }
  };

  const visit = (node: ts.Node) => {
    const addImportWithNode = (result: ImportNode) => addImport(result, node);

    for (const visitor of visitors.dynamicImport) {
      const result = visitor(node, options);
      result && (Array.isArray(result) ? result.forEach(addImportWithNode) : addImportWithNode(result));
    }

    // Skip some work by handling only top-level import/export assignments
    const isTopLevel =
      node.parent &&
      ('commonJsModuleIndicator' in sourceFile
        ? node.parent.parent === sourceFile || node.parent === sourceFile
        : node.parent === sourceFile);

    if (isTopLevel) {
      for (const visitor of visitors.import) {
        const result = visitor(node, options);
        result && (Array.isArray(result) ? result.forEach(addImportWithNode) : addImportWithNode(result));
      }

      for (const visitor of visitors.export) {
        const result = visitor(node, options);
        result && (Array.isArray(result) ? result.forEach(addExport) : addExport(result));
      }
    }

    for (const visitor of visitors.script) {
      const result = visitor(node, options);
      result && (Array.isArray(result) ? result.forEach(addScript) : addScript(result));
    }

    if (ts.isIdentifier(node)) {
      const id = String(node.escapedText);
      const symbol = sourceFile.locals?.get(id);
      if (symbol) {
        const importedSymbolFilePath = importedInternalSymbols.get(symbol);
        if (importedSymbolFilePath) {
          if (!isImportSpecifier(node)) {
            const imports = internalImports.get(importedSymbolFilePath);
            if (imports) {
              traceRefs.add(id);
              if (isAccessExpression(node.parent)) {
                if (isDestructuring(node.parent)) {
                  if (ts.isPropertyAccessExpression(node.parent)) {
                    // Pattern: const { a, b } = NS.sub;
                    const ns = String(symbol.escapedName);
                    const key = String(node.parent.name.escapedText);
                    // @ts-expect-error safe after isDestructuring
                    const members = getDestructuredIds(node.parent.parent.name).map(n => `${key}.${n}`);
                    maybeAddAccessExpressionAsNsImport(ns, key);
                    maybeAddAccessExpressionAsNsImport(ns, members);
                  }
                } else {
                  // Patterns: NS.id, NS['id'], NS.sub.id, NS[type], etc.
                  const members = getAccessMembers(typeChecker, node);
                  maybeAddAccessExpressionAsNsImport(id, members);
                }
              } else if (isDestructuring(node)) {
                // Pattern: const { a, b } = NS;
                // @ts-expect-error safe after isDestructuring
                const members = getDestructuredIds(node.parent.name);
                maybeAddAccessExpressionAsNsImport(id, members);
              } else {
                const typeName = getTypeName(node);
                if (typeName) {
                  const [ns, ...right] = [typeName.left.getText(), typeName.right.getText()].join('.').split('.');
                  const members = right.map((_r, index) => right.slice(0, index + 1).join('.'));
                  maybeAddAccessExpressionAsNsImport(ns, members);
                } else if (imports.importedNs.has(id) && isConsiderReferencedNS(node)) {
                  imports.refs.add(id);
                } else {
                  imports.refs.add(id);
                }
              }
            }
          }
        }

        if (
          (ignoreExportsUsedInFile || isTypeDeclaration(node) || ts.isClassDeclaration(node)) &&
          !isTopLevel &&
          isReferencedInExportedType(node)
        ) {
          // @ts-expect-error
          referencedSymbolsInExportedTypes.add(symbol.exportSymbol);
        }
      }
    }

    if (
      isTopLevel &&
      ts.isImportEqualsDeclaration(node) &&
      ts.isQualifiedName(node.moduleReference) &&
      ts.isIdentifier(node.moduleReference.left)
    ) {
      // Pattern: import name = NS.identifier
      const { left, right } = node.moduleReference;
      if (sourceFile.locals?.get(left.text)) maybeAddAccessExpressionAsNsImport(left.text, right.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // No file-level visitors yet, so let's keep it simple
  const pragmaImports = getImportsFromPragmas(sourceFile);
  if (pragmaImports) for (const node of pragmaImports) addImport(node, sourceFile);

  const isSetRefs = ignoreExportsUsedInFile;
  for (const item of exports.values()) {
    if (isSetRefs === true || (typeof isSetRefs === 'object' && item.type !== 'unknown' && !!isSetRefs[item.type])) {
      item.refs = findInternalReferences(item, sourceFile, typeChecker, referencedSymbolsInExportedTypes);
    }
    for (const member of item.members) {
      member.refs = findInternalReferences(member, sourceFile, typeChecker, referencedSymbolsInExportedTypes);
      member.symbol = undefined;
    }
    item.symbol = undefined;
  }

  return {
    imports: {
      internal: internalImports,
      external: externalImports,
      resolved,
      specifiers,
      unresolved: unresolvedImports,
    },
    exports: {
      exported: exports,
      duplicate: [...aliasedExports.values()],
    },
    scripts,
    traceRefs,
  };
};

export const _getImportsAndExports = timerify(getImportsAndExports);
