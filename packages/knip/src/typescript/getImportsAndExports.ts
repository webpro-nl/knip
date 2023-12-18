import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.js';
import { isInNodeModules } from '../util/path.js';
import { timerify } from '../util/Performance.js';
import {
  isDeclarationFileExtension,
  isAccessExpression,
  getJSDocTags,
  getLineAndCharacterOfPosition,
  getMemberStringLiterals,
} from './ast-helpers.js';
import getDynamicImportVisitors from './visitors/dynamic-imports/index.js';
import getExportVisitors from './visitors/exports/index.js';
import { getJSXImplicitImportBase } from './visitors/helpers.js';
import getImportVisitors from './visitors/imports/index.js';
import getScriptVisitors from './visitors/scripts/index.js';
import type { BoundSourceFile, GetResolvedModule } from './SourceFile.js';
import type {
  ExportNode,
  SerializableExport,
  SerializableExportMember,
  SerializableExports,
} from '../types/exports.js';
import type { ImportNode, SerializableImportMap, UnresolvedImport } from '../types/imports.js';
import type { IssueSymbol } from '../types/issues.js';

const getVisitors = (sourceFile: ts.SourceFile) => ({
  export: getExportVisitors(sourceFile),
  import: getImportVisitors(sourceFile),
  dynamicImport: getDynamicImportVisitors(sourceFile),
  script: getScriptVisitors(sourceFile),
});

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  skipExports: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  ignoreExportsUsedInFile: boolean;
};

interface AddInternalImportOptions extends ImportNode {
  namespace?: string;
  identifier: string;
  filePath: string;
  isReExport: boolean;
}

const getImportsAndExports = (
  sourceFile: BoundSourceFile,
  getResolvedModule: GetResolvedModule,
  typeChecker: ts.TypeChecker,
  options: GetImportsAndExportsOptions
) => {
  const { skipTypeOnly } = options;
  const internalImports: SerializableImportMap = {};
  const externalImports = new Set<string>();
  const unresolvedImports = new Set<UnresolvedImport>();
  const exports: SerializableExports = {};
  const aliasedExports = new Map<string, IssueSymbol[]>();
  const scripts = new Set<string>();

  const importedInternalSymbols = new Map<ts.Symbol, string>();

  // No file-level visitors yet, so let's keep it simple
  const jsxImport = getJSXImplicitImportBase(sourceFile);
  if (jsxImport) externalImports.add(jsxImport);

  const visitors = getVisitors(sourceFile);

  const addInternalImport = (options: AddInternalImportOptions) => {
    const { identifier, specifier, symbol, filePath, namespace, isReExport } = options;

    const isStar = identifier === '*';

    const internalImport = (internalImports[filePath] = internalImports[filePath] ?? {
      specifier,
      hasStar: isStar,
      isReExport,
      isReExportedBy: new Set<string>(),
      isReExportedAs: new Set<[string, string]>(),
      isReExportedAsNs: new Set<[string, string]>(),
      isImportedBy: new Set<string>(),
      importedNs: new Set<string>(),
      symbols: [],
    });

    if (isReExport && isStar) {
      internalImport.isReExport = true;
      if (namespace) {
        internalImport.isReExportedAsNs.add([sourceFile.fileName, namespace]);
      } else {
        internalImport.isReExportedBy.add(sourceFile.fileName);
      }
    } else if (isReExport) {
      internalImport.isReExport = true;
      if (namespace) {
        internalImport.isReExportedAs.add([sourceFile.fileName, namespace]);
        internalImport.symbols.push(namespace);
      } else {
        internalImport.isReExportedBy.add(sourceFile.fileName);
        internalImport.symbols.push(identifier);
      }
    } else if (isStar) {
      internalImport.hasStar = true;
      if (symbol) internalImport.importedNs.add(String(symbol.escapedName));
    } else {
      internalImport.symbols.push(identifier.replace(/^\*:/, ''));
    }

    if (symbol) importedInternalSymbols.set(symbol, filePath);

    internalImport.isImportedBy.add(sourceFile.fileName);
  };

  const addImport = (options: ImportNode) => {
    const { specifier, isTypeOnly, pos, identifier = '__anonymous', isReExport = false } = options;
    if (isBuiltin(specifier)) return;

    const module = getResolvedModule(specifier);

    if (module?.resolvedModule) {
      const filePath = module.resolvedModule.resolvedFileName;
      if (filePath) {
        if (module.resolvedModule.isExternalLibraryImport) {
          if (!isInNodeModules(filePath)) {
            addInternalImport({ ...options, identifier, filePath, isReExport });
          }

          if (skipTypeOnly && isTypeOnly) return;

          const sanitizedSpecifier = sanitizeSpecifier(specifier);
          if (!isStartsLikePackageName(sanitizedSpecifier)) {
            // Import maps and other exceptions, examples from tests: #dep, #internals/used, $app/stores
            return;
          }

          if (isDeclarationFileExtension(module.resolvedModule.extension)) {
            // We use TypeScript's module resolution, but it returns DTS references. In the rest of the program we want
            // the package name based on the original specifier.
            externalImports.add(sanitizedSpecifier);
          } else {
            externalImports.add(module.resolvedModule.packageId?.name ?? sanitizedSpecifier);
          }
        } else {
          addInternalImport({ ...options, identifier, filePath, isReExport });
        }
      }
    } else {
      if (skipTypeOnly && isTypeOnly) return;

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
        const internalImport = internalImports[importedSymbolFilePath];
        if (typeof member === 'string') internalImport.symbols.push(`${namespace}.${member}`);
        else member.forEach(member => internalImport.symbols.push(`${namespace}.${member}`));
      }
    }
  };

  const addExport = ({ node, symbol, identifier, type, pos, members = [], fix }: ExportNode) => {
    if (options.skipExports) return;

    if (ts.isExportSpecifier(node)) {
      // Re-exports are handled in import visitors (because module resolution),
      // but in other export declarations we can't (easily) get the imported symbol for indirect/mediated re-exports
      if (node.propertyName) {
        // TODO Tried to sort it out in visitors/exports/exportDeclaration.ts,
        // but seems we need `typeChecker.getSymbolAtLocation` which isn't available over there
        const symbol = typeChecker.getSymbolAtLocation(node.propertyName);
        if (symbol) {
          const importedSymbolFilePath = importedInternalSymbols.get(symbol);
          if (importedSymbolFilePath) {
            const internalImport = internalImports[importedSymbolFilePath];
            internalImport.isReExportedAs.add([sourceFile.fileName, node.name.getText()]);
          }
        }
      } else if (symbol) {
        const importedSymbolFilePath = importedInternalSymbols.get(symbol);
        if (importedSymbolFilePath) {
          const internalImport = internalImports[importedSymbolFilePath];
          internalImport.isReExport = true;
          internalImport.isReExportedAs.add([sourceFile.fileName, identifier]);
        }
      }
    }

    const jsDocTags = getJSDocTags(node);

    const m = members.map(member => {
      const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
      return {
        // @ts-expect-error TODO
        symbol: member.node.symbol,
        identifier: member.identifier,
        type: member.type,
        pos: member.pos,
        line: line + 1,
        col: character + 1,
        fix: member.fix,
        refs: 0,
      };
    });

    if (exports[identifier]) {
      const item = exports[identifier];
      const crew = [...(item.members ?? []), ...m];
      const tags = [...(item.jsDocTags ?? []), ...jsDocTags];
      const fixes = fix ? [...(item.fixes ?? []), fix] : item.fixes;
      exports[identifier] = { ...item, members: crew, jsDocTags: tags, fixes };
    } else {
      const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
      exports[identifier] = {
        identifier,
        // @ts-expect-error TODO
        symbol: node.symbol,
        type,
        members: m,
        jsDocTags,
        pos,
        line: line + 1,
        col: character + 1,
        fixes: fix ? [fix] : [],
        refs: 0,
      };
    }

    if (!jsDocTags.includes('@alias')) {
      if (ts.isExportAssignment(node)) maybeAddAliasedExport(node.expression, 'default');
      if (ts.isVariableDeclaration(node)) maybeAddAliasedExport(node.initializer, identifier);
    }
  };

  const addScript = (script: string) => scripts.add(script);

  const maybeAddAliasedExport = (node: ts.Expression | undefined, alias: string) => {
    const identifier = node?.getText();
    if (node && identifier) {
      const exprt = sourceFile.symbol?.exports?.get(identifier);
      if (exprt && exprt.valueDeclaration) {
        if (!aliasedExports.has(identifier)) {
          const pos = getLineAndCharacterOfPosition(exprt.valueDeclaration, exprt.valueDeclaration.pos);
          aliasedExports.set(identifier, [{ symbol: identifier, ...pos }]);
        }
        const i = aliasedExports.get(identifier);
        const pos = getLineAndCharacterOfPosition(node, node.pos);
        i?.push({ symbol: alias, ...pos });
      }
    }
  };

  const visit = (node: ts.Node) => {
    for (const visitor of visitors.dynamicImport) {
      const result = visitor(node, options);
      result && (Array.isArray(result) ? result.forEach(addImport) : addImport(result));
    }

    // Skip some work by handling only top-level import/export assignments
    const isTopLevel = node.parent === sourceFile || node.parent?.parent === sourceFile;

    if (isTopLevel) {
      for (const visitor of visitors.import) {
        const result = visitor(node, options);
        result && (Array.isArray(result) ? result.forEach(addImport) : addImport(result));
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

    if (ts.isIdentifier(node) && isAccessExpression(node.parent)) {
      const symbol = sourceFile.locals?.get(String(node.escapedText));
      if (symbol) {
        if (importedInternalSymbols.has(symbol)) {
          let members: string[] = [];
          let current: ts.Node = node.parent;
          while (current) {
            const ms = getMemberStringLiterals(typeChecker, current);
            if (!ms) break;
            members = [ms].flat().flatMap(id => (members.length === 0 ? id : members.map(ns => `${ns}.${id}`)));
            current = current.parent;
          }
          maybeAddAccessExpressionAsNsImport(String(node.escapedText), members);
        }
      }
    }

    if (ts.isTypeReferenceNode(node) && ts.isQualifiedName(node.typeName)) {
      maybeAddAccessExpressionAsNsImport(node.typeName.left.getText(), node.typeName.right.getText());
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  const setRefs = (item: SerializableExport | SerializableExportMember) => {
    if (!item.symbol) return;
    for (const match of sourceFile.text.matchAll(new RegExp(item.identifier.replace(/\$/g, '\\$'), 'g'))) {
      const isDeclaration = match.index === item.pos || match.index === item.pos + 1; // off-by-one from `stripQuotes` but we don't want to change the `pos` either
      if (
        !isDeclaration &&
        // @ts-expect-error ts.getTokenAtPosition is internal fn
        typeChecker.getSymbolAtLocation(ts.getTokenAtPosition(sourceFile, match.index)) === item.symbol
      ) {
        item.refs = 1;
        break;
      }
    }
  };

  for (let key in exports) {
    const item = exports[key];
    if (options.ignoreExportsUsedInFile) setRefs(item);
    item.members.forEach(member => setRefs(member));
    delete item.symbol;
  }

  return {
    imports: {
      internal: internalImports,
      external: externalImports,
      unresolved: unresolvedImports,
    },
    exports: {
      exported: exports,
      duplicate: [...aliasedExports.values()],
    },
    scripts,
  };
};

export const _getImportsAndExports = timerify(getImportsAndExports);
