import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { getOrSet } from '../util/map.js';
import { isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.js';
import { isInNodeModules } from '../util/path.js';
import {
  isDeclarationFileExtension,
  isAccessExpression,
  getAccessExpressionName,
  getJSDocTags,
  getLineAndCharacterOfPosition,
} from './ast-helpers.js';
import getExportVisitors from './visitors/exports/index.js';
import { getJSXImplicitImportBase } from './visitors/helpers.js';
import getImportVisitors from './visitors/imports/index.js';
import getScriptVisitors from './visitors/scripts/index.js';
import type { BoundSourceFile, GetResolvedModule } from './SourceFile.js';
import type { ExportItems as Exports, ExportItem } from '../types/exports.js';
import type { Imports, UnresolvedImport } from '../types/imports.js';
import type { IssueSymbol } from '../types/issues.js';

const getVisitors = (sourceFile: ts.SourceFile) => ({
  export: getExportVisitors(sourceFile),
  import: getImportVisitors(sourceFile),
  script: getScriptVisitors(sourceFile),
});

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  skipExports: boolean;
};

export type AddImportOptions = {
  specifier: string;
  symbol?: ts.Symbol;
  identifier?: string;
  isReExport?: boolean;
  pos?: number;
};

type AddInternalImportOptions = AddImportOptions & {
  identifier: string;
  filePath: string;
  isReExport: boolean;
};

export type AddExportOptions = ExportItem & { identifier: string };

export const getImportsAndExports = (
  sourceFile: BoundSourceFile,
  getResolvedModule: GetResolvedModule,
  options: GetImportsAndExportsOptions
) => {
  const internalImports: Imports = new Map();
  const externalImports = new Set<string>();
  const unresolvedImports = new Set<UnresolvedImport>();
  const exports: Exports = new Map();
  const aliasedExports = new Map<string, IssueSymbol[]>();
  const scripts = new Set<string>();

  const importedInternalSymbols = new Map<ts.Symbol, string>();

  // No file-level visitors yet, so let's keep it simple
  const jsxImport = getJSXImplicitImportBase(sourceFile);
  if (jsxImport) externalImports.add(jsxImport);

  const visitors = getVisitors(sourceFile);

  const addInternalImport = (options: AddInternalImportOptions) => {
    const { identifier, specifier, symbol, filePath, isReExport } = options;

    const isStar = identifier === '*';

    const internalImport = getOrSet(internalImports, filePath, {
      specifier,
      hasStar: isStar,
      isReExport,
      isReExportedBy: new Set(),
      symbols: new Set(),
    });

    if (isReExport) {
      internalImport.isReExport = isReExport;
      internalImport.isReExportedBy.add(sourceFile.fileName);
    }

    if (isStar) internalImport.hasStar = true;

    if (!isStar) internalImport.symbols.add(identifier);

    // Store imported namespace symbol for reference in `maybeAddNamespaceAccessAsImport`
    if (isStar && symbol) importedInternalSymbols.set(symbol, filePath);
  };

  const addImport = (options: AddImportOptions) => {
    const { specifier, symbol, identifier = '__anonymous', isReExport = false, pos } = options;
    if (isBuiltin(specifier)) return;

    const module = getResolvedModule(specifier);

    if (module?.resolvedModule) {
      const filePath = module.resolvedModule.resolvedFileName;
      if (filePath) {
        if (module.resolvedModule.isExternalLibraryImport) {
          if (!isInNodeModules(filePath)) {
            addInternalImport({ identifier, specifier, symbol, filePath, isReExport });
          }

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
          addInternalImport({ identifier, specifier, symbol, filePath, isReExport });
        }
      }
    } else {
      if (typeof pos === 'number') {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
        unresolvedImports.add({ specifier, pos, line: line + 1, col: character + 1 });
      } else {
        unresolvedImports.add({ specifier });
      }
    }
  };

  /**
   * Perhaps odd to try this for every obj.prop access, but it's cheaper to pretend `import * as NS from 'mod';
   * NS.exportValue` was imported as `exportValue` directly. Otherwise we have to find references to `exportValue`
   * across the program later on. More namespaces, more gains, easily up to ~10% in total running time.
   */
  const maybeAddNamespaceAccessAsImport = ({ namespace, member }: { namespace: string; member: string }) => {
    const symbol = sourceFile.locals?.get(namespace);
    if (symbol) {
      const importedSymbolFilePath = importedInternalSymbols.get(symbol);
      if (importedSymbolFilePath) {
        const internalImport = internalImports.get(importedSymbolFilePath);
        // The referenced imported namespace member is the exported identifier
        internalImport?.symbols.add(member);
      }
    }
  };

  const addExport = ({ node, identifier, type, pos, posDecl, members = [] }: AddExportOptions) => {
    if (options.skipExports) return;

    const jsDocTags = getJSDocTags(node);

    if (exports.has(identifier)) {
      const item = exports.get(identifier)!;
      const crew = [...item.members, ...members];
      const tags = new Set([...item.jsDocTags, ...jsDocTags]);
      exports.set(identifier, { ...item, members: crew, jsDocTags: tags });
    } else {
      exports.set(identifier, { node, type, members, jsDocTags, pos, posDecl: posDecl ?? pos });
    }

    if (!jsDocTags.has('@alias')) {
      if (ts.isExportAssignment(node)) maybeAddAliasedExport(node.expression, 'default');
      if (ts.isVariableDeclaration(node)) maybeAddAliasedExport(node.initializer, identifier);
    }
  };

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
    for (const visitor of visitors.import) {
      if (visitor) {
        const results = visitor(node, options);
        if (results) [results].flat().forEach(addImport);
      }
    }

    // Skip exports in module blocks
    // const isModuleBlockTopLevel = node.parent?.parent && ts.isModuleDeclaration(node.parent.parent);
    const isTopLevel = node.parent === sourceFile || node.parent?.parent === sourceFile;

    if (isTopLevel) {
      for (const visitor of visitors.export) {
        if (visitor) {
          const results = visitor(node, options);
          if (results) [results].flat().forEach(addExport);
        }
      }
    }

    for (const visitor of visitors.script) {
      if (visitor) {
        const results = visitor(node, options);
        if (results) [results].flat().forEach(script => scripts.add(script));
      }
    }

    if (isAccessExpression(node)) {
      maybeAddNamespaceAccessAsImport({
        namespace: node.expression.getText(),
        member: getAccessExpressionName(node),
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

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
