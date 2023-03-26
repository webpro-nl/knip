import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { isInNodeModules } from '../util/path.js';
import * as ast from './ast-helpers.js';
import getExportVisitors from './visitors/exports/index.js';
import getImportVisitors from './visitors/imports/index.js';
import type { BoundSourceFile } from './SourceFile.js';
import type { ExportItems as Exports, ExportItem } from '../types/exports.js';
import type { Imports } from '../types/imports.js';

const getVisitors = (sourceFile: ts.SourceFile) => ({
  export: getExportVisitors(sourceFile),
  import: getImportVisitors(sourceFile),
});

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  skipExports: boolean;
};

export type AddImportOptions = {
  specifier: string;
  symbol?: ts.Symbol;
  identifier?: string;
};

export type AddExportOptions = ExportItem & { identifier: string };

export const getImportsAndExports = (sourceFile: BoundSourceFile, options: GetImportsAndExportsOptions) => {
  const internalImports: Imports = new Map();
  const externalImports: Set<string> = new Set();
  const unresolvedImports: Set<string> = new Set();
  const exports: Exports = new Map();
  const aliasedExports: Record<string, string[]> = {};

  const importedInternalSymbols: Map<ts.Symbol, string> = new Map();

  const visitors = getVisitors(sourceFile);

  const addInternalImport = ({
    identifier = '__anonymous',
    specifier,
    symbol,
    filePath,
  }: AddImportOptions & { filePath: string }) => {
    const isStar = identifier === '*';
    const isReExported = Boolean(isStar && !symbol);

    if (!internalImports.has(filePath)) {
      internalImports.set(filePath, {
        specifier,
        isStar,
        isReExported,
        isReExportedBy: new Set(),
        symbols: new Set(),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const internalImport = internalImports.get(filePath)!;

    if (isReExported) {
      internalImport.isReExported = isReExported;
      internalImport.isReExportedBy.add(sourceFile.fileName);
    }

    if (isStar) {
      internalImport.isStar = isStar;
    }

    if (!isStar) {
      internalImport.symbols.add(identifier);
    }

    if (isStar && symbol) {
      // Store imported namespace symbol for reference in `maybeAddNamespaceAccessAsImport`
      importedInternalSymbols.set(symbol, filePath);
    }
  };

  const addImport = ({ specifier, symbol, identifier = '__anonymous' }: AddImportOptions) => {
    if (isBuiltin(specifier)) return;

    const module = sourceFile.resolvedModules?.get(specifier, /* mode */ undefined);

    if (module?.resolvedModule) {
      const filePath = module.resolvedModule.resolvedFileName;
      if (filePath) {
        if (module.resolvedModule.isExternalLibraryImport) {
          if (!isInNodeModules(filePath)) {
            // Self-referencing imports are resolved by `sourceFile.resolvedModules`, but not part of the program
            // through `principal.createProgram`. Add as internal import, and follow up with `principal.addEntryPath`.
            addInternalImport({ identifier, specifier, symbol, filePath });
          } else if (ast.isDeclarationFileExtension(module.resolvedModule.extension)) {
            // We use TypeScript's module resolution, but it returns @types/pkg. In the rest of the program we want the
            // package name based on the original specifier.
            externalImports.add(specifier);
          } else {
            externalImports.add(module.resolvedModule.packageId?.name ?? specifier);
          }
        } else {
          addInternalImport({ identifier, specifier, symbol, filePath });
        }
      }
    } else {
      unresolvedImports.add(specifier);
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

  const addExport = ({ node, identifier, type, pos, members }: AddExportOptions) => {
    if (options.skipExports) return;
    if (exports.has(identifier)) {
      const item = exports.get(identifier);
      exports.set(identifier, { ...item, node, type, pos, members });
    } else {
      exports.set(identifier, { node, type, pos, members });
    }

    if (ts.isExportAssignment(node)) maybeAddAliasedExport(node.expression, 'default');
    if (ts.isVariableDeclaration(node)) maybeAddAliasedExport(node.initializer, identifier);
  };

  const maybeAddAliasedExport = (node: ts.Expression | undefined, alias: string) => {
    const identifier = node?.getText();
    if (identifier && sourceFile.symbol?.exports?.has(identifier)) {
      aliasedExports[identifier] = aliasedExports[identifier] ?? [identifier];
      aliasedExports[identifier].push(alias);
    }
  };

  const visit = (node: ts.Node) => {
    for (const visitor of visitors.import) {
      if (visitor) {
        const results = visitor(node, options);
        if (results) {
          [results].flat().forEach(addImport);
          return;
        }
      }
    }

    for (const visitor of visitors.export) {
      if (visitor) {
        const results = visitor(node, options);
        if (results) {
          [results].flat().forEach(addExport);
          return;
        }
      }
    }

    if (ast.isAccessExpression(node)) {
      maybeAddNamespaceAccessAsImport({
        namespace: node.expression.getText(),
        member: ast.getAccessExpressionName(node),
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
    exports,
    duplicateExports: Object.values(aliasedExports),
  };
};
