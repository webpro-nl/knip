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
  ExportNodeMember,
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

const createSerializableMember = (node: ts.Node, member: ExportNodeMember, pos: number): SerializableExportMember => {
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
    jsDocTags: getJSDocTags(member.node),
  };
};

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
      isReExportedBy: new Set(),
      isReExportedAs: new Set(),
      isReExportedNs: new Set(),
      importedNs: new Set(),
      identifiers: new Set(),
    });

    if (isReExport) {
      internalImport.isReExport = true;
      if (namespace && isStar) internalImport.isReExportedAs.add([sourceFile.fileName, namespace]);
      else if (namespace) internalImport.isReExportedNs.add([sourceFile.fileName, namespace]);
      else internalImport.isReExportedBy.add(sourceFile.fileName);
    }

    if (isStar) {
      internalImport.hasStar = true;
      if (symbol) internalImport.importedNs.add(String(symbol.escapedName));
    } else {
      internalImport.identifiers.add(namespace ?? identifier);
    }

    if (symbol) importedInternalSymbols.set(symbol, filePath);
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
        if (typeof member === 'string') internalImport.identifiers.add(`${namespace}.${member}`);
        else member.forEach(member => internalImport.identifiers.add(`${namespace}.${member}`));
      }
    }
  };

  const addExport = ({ node, symbol, identifier, type, pos, members = [], fix }: ExportNode) => {
    if (options.skipExports) return;

    const isExportSpecifier = ts.isExportSpecifier(node);
    const isExportAssignment = ts.isExportAssignment(node);

    if (isExportSpecifier || isExportAssignment) {
      // Re-exports are handled in import visitors (because module resolution),
      // but in other export declarations we can't (easily) get the imported symbol for indirect/mediated re-exports
      if (isExportSpecifier && node.propertyName) {
        // TODO Tried to sort it out in visitors/exports/exportDeclaration.ts,
        // but seems we need `typeChecker.getSymbolAtLocation` which isn't available over there
        const symbol = typeChecker.getSymbolAtLocation(node.propertyName);
        if (symbol) {
          const importedSymbolFilePath = importedInternalSymbols.get(symbol);
          if (importedSymbolFilePath) {
            const internalImport = internalImports[importedSymbolFilePath];
            internalImport.isReExport = true;
            internalImport.isReExportedAs.add([sourceFile.fileName, node.name.getText()]);
          }
        }
      } else if (symbol) {
        const importedSymbolFilePath = importedInternalSymbols.get(symbol);
        if (importedSymbolFilePath) {
          const internalImport = internalImports[importedSymbolFilePath];
          internalImport.isReExport = true;
          if (isExportAssignment) {
            internalImport.isReExportedAs.add([sourceFile.fileName, 'default']);
          } else {
            internalImport.isReExportedNs.add([sourceFile.fileName, identifier]);
          }
        }
      }
    }

    const jsDocTags = getJSDocTags(node);

    const serializedMembers = members.map(member => createSerializableMember(node, member, member.pos));

    if (exports[identifier]) {
      const item = exports[identifier];
      const members = [...(item.members ?? []), ...serializedMembers];
      const tags = [...(item.jsDocTags ?? []), ...jsDocTags];
      const fixes = fix ? [...(item.fixes ?? []), fix] : item.fixes;
      exports[identifier] = { ...item, members, jsDocTags: tags, fixes };
    } else {
      const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
      exports[identifier] = {
        identifier,
        // @ts-expect-error TODO
        symbol: node.symbol,
        type,
        members: serializedMembers,
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
      const symbol = sourceFile.symbol?.exports?.get(identifier);
      if (symbol && symbol.valueDeclaration) {
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
            members = members.concat(ms.flatMap(id => (members.length === 0 ? id : members.map(ns => `${ns}.${id}`))));
            current = current.parent;
          }
          maybeAddAccessExpressionAsNsImport(String(node.escapedText), members);
        }
      }
    }

    if (ts.isTypeReferenceNode(node) && ts.isQualifiedName(node.typeName)) {
      const [ns, ...right] = [node.typeName.left.getText(), node.typeName.right.getText()].join('.').split('.');
      const members = right.map((_r, index) => right.slice(0, index + 1).join('.'));
      maybeAddAccessExpressionAsNsImport(ns, members);
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
    item.members.forEach(member => {
      setRefs(member);
      delete member.symbol;
    });
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
